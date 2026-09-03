<?php

declare(strict_types=1);

namespace Flexa\SeoAeo\Support;

defined( 'ABSPATH' ) || exit;

/**
 * Single source of truth for the `flexa_seo_aeo_onboarding` option: the Setup
 * Assistant's progress and what it applied. Mirrors {@see Settings}: a typed
 * schema, defaults, a coercing read, a sanitizer that drops unknown keys and
 * invalid enum values, and a merge-over-stored write.
 *
 * Only progress and applied-key bookkeeping live here. Detection and
 * recommendations are recomputed on every request (see the Detector and
 * Recommended services), so nothing that can drift is ever persisted.
 *
 * Timestamps are server-authoritative: the client POSTs a status and the write
 * stamps started/completed/dismissed once, never trusting a client clock.
 */
final class OnboardingState {
	public const OPTION_KEY = 'flexa_seo_aeo_onboarding';

	/** Bumped when the option shape changes so a future build can migrate it. */
	private const VERSION = 1;

	/** @var list<string> */
	private const STATUSES = [ 'pending', 'in_progress', 'completed', 'dismissed' ];

	/** @var list<string> */
	private const STEPS = [ 'welcome', 'seo', 'aeo', 'content', 'migration', 'report' ];

	/** The Apply scopes the wizard records changed keys under. */
	private const SCOPES = [ 'seo', 'aeo' ];

	/**
	 * The full default state payload.
	 *
	 * @return array<string, mixed>
	 */
	public static function defaults(): array {
		return [
			'version'         => self::VERSION,
			'status'          => 'pending',
			'current_step'    => 'welcome',
			'completed_steps' => [],
			'applied'         => [
				'seo' => [],
				'aeo' => [],
			],
			'started_at'      => null,
			'completed_at'    => null,
			'dismissed_at'    => null,
		];
	}

	/**
	 * Stored state merged over defaults, every value coerced back to its declared
	 * type so a hand-edited or corrupt option can never hand a consumer the wrong
	 * shape.
	 *
	 * @return array<string, mixed>
	 */
	public static function all(): array {
		$stored = get_option( self::OPTION_KEY, [] );
		if ( ! is_array( $stored ) ) {
			$stored = [];
		}

		return self::coerce( $stored );
	}

	/**
	 * Read a single top-level value with its default fallback.
	 */
	public static function get( string $key ): mixed {
		return self::all()[ $key ] ?? null;
	}

	/**
	 * True once the user has finished or dismissed setup. Used to suppress the
	 * activation redirect and the plugins-screen notice.
	 */
	public static function is_finished(): bool {
		$status = self::all()['status'];

		return in_array( $status, [ 'completed', 'dismissed' ], true );
	}

	/**
	 * Apply a (possibly partial) client payload over the stored state and persist.
	 * `completed_steps` and `applied.*` accumulate (union + dedupe) so the
	 * non-atomic "apply settings then record step" client sequence is idempotent;
	 * `status` and `current_step` replace. Timestamps are stamped here, once.
	 *
	 * @param array<string, mixed> $partial
	 * @return array<string, mixed> The full coerced state after the write.
	 */
	public static function update( array $partial ): array {
		$next  = self::all();
		$clean = self::sanitize( $partial );

		if ( isset( $clean['status'] ) ) {
			$next['status'] = $clean['status'];
		}
		if ( isset( $clean['current_step'] ) ) {
			$next['current_step'] = $clean['current_step'];
		}
		if ( isset( $clean['completed_steps'] ) ) {
			$next['completed_steps'] = array_values(
				array_unique( array_merge( $next['completed_steps'], $clean['completed_steps'] ) )
			);
		}
		if ( isset( $clean['applied'] ) ) {
			foreach ( self::SCOPES as $scope ) {
				if ( isset( $clean['applied'][ $scope ] ) ) {
					$next['applied'][ $scope ] = array_values(
						array_unique( array_merge( $next['applied'][ $scope ], $clean['applied'][ $scope ] ) )
					);
				}
			}
		}

		// Server-authoritative timestamps: each stamped once on first transition.
		if ( 'in_progress' === $next['status'] && null === $next['started_at'] ) {
			$next['started_at'] = time();
		}
		if ( 'completed' === $next['status'] && null === $next['completed_at'] ) {
			$next['completed_at'] = time();
		}
		if ( 'dismissed' === $next['status'] && null === $next['dismissed_at'] ) {
			$next['dismissed_at'] = time();
		}

		$next['version'] = self::VERSION;

		update_option( self::OPTION_KEY, $next );

		return self::coerce( $next );
	}

	/**
	 * Sanitize an incoming payload against the schema. Only the four writable
	 * keys are honoured; unknown keys and invalid enum values are dropped so
	 * arbitrary client input is never persisted, and timestamps stay server-owned.
	 *
	 * @param array<string, mixed> $incoming
	 * @return array<string, mixed>
	 */
	public static function sanitize( array $incoming ): array {
		$clean = [];

		if ( array_key_exists( 'status', $incoming ) ) {
			$status = is_scalar( $incoming['status'] ) ? (string) $incoming['status'] : '';
			if ( in_array( $status, self::STATUSES, true ) ) {
				$clean['status'] = $status;
			}
		}

		if ( array_key_exists( 'current_step', $incoming ) ) {
			$step = is_scalar( $incoming['current_step'] ) ? (string) $incoming['current_step'] : '';
			if ( in_array( $step, self::STEPS, true ) ) {
				$clean['current_step'] = $step;
			}
		}

		if ( array_key_exists( 'completed_steps', $incoming ) && is_array( $incoming['completed_steps'] ) ) {
			$steps = [];
			foreach ( $incoming['completed_steps'] as $step ) {
				$step = is_scalar( $step ) ? (string) $step : '';
				if ( in_array( $step, self::STEPS, true ) ) {
					$steps[] = $step;
				}
			}
			$clean['completed_steps'] = array_values( array_unique( $steps ) );
		}

		if ( array_key_exists( 'applied', $incoming ) && is_array( $incoming['applied'] ) ) {
			$applied = [];
			foreach ( self::SCOPES as $scope ) {
				$scoped = $incoming['applied'][ $scope ] ?? null;
				if ( is_array( $scoped ) ) {
					$applied[ $scope ] = self::sanitize_keys( $scoped );
				}
			}
			if ( [] !== $applied ) {
				$clean['applied'] = $applied;
			}
		}

		return $clean;
	}

	/**
	 * @param array<string, mixed> $stored
	 * @return array<string, mixed>
	 */
	private static function coerce( array $stored ): array {
		$out = self::defaults();

		if ( isset( $stored['status'] ) && in_array( $stored['status'], self::STATUSES, true ) ) {
			$out['status'] = $stored['status'];
		}
		if ( isset( $stored['current_step'] ) && in_array( $stored['current_step'], self::STEPS, true ) ) {
			$out['current_step'] = $stored['current_step'];
		}
		if ( isset( $stored['completed_steps'] ) && is_array( $stored['completed_steps'] ) ) {
			$steps = [];
			foreach ( $stored['completed_steps'] as $step ) {
				if ( is_string( $step ) && in_array( $step, self::STEPS, true ) ) {
					$steps[] = $step;
				}
			}
			$out['completed_steps'] = array_values( array_unique( $steps ) );
		}
		if ( isset( $stored['applied'] ) && is_array( $stored['applied'] ) ) {
			foreach ( self::SCOPES as $scope ) {
				$scoped = $stored['applied'][ $scope ] ?? null;
				if ( is_array( $scoped ) ) {
					$out['applied'][ $scope ] = self::sanitize_keys( $scoped );
				}
			}
		}
		foreach ( [ 'started_at', 'completed_at', 'dismissed_at' ] as $ts ) {
			if ( isset( $stored[ $ts ] ) && is_numeric( $stored[ $ts ] ) ) {
				$out[ $ts ] = (int) $stored[ $ts ];
			}
		}

		$out['version'] = self::VERSION;

		return $out;
	}

	/**
	 * Sanitize a list of setting-key tokens (the keys the wizard applied) down to
	 * a stable `a-z0-9_.` set — dotted keys like `aeo.schema` are kept intact.
	 *
	 * @param array<int|string, mixed> $value
	 * @return list<string>
	 */
	private static function sanitize_keys( array $value ): array {
		$out = [];
		foreach ( $value as $item ) {
			if ( ! is_scalar( $item ) ) {
				continue;
			}
			$item = (string) preg_replace( '/[^a-z0-9_.]/', '', strtolower( (string) $item ) );
			if ( '' !== $item ) {
				$out[] = $item;
			}
		}

		return array_values( array_unique( $out ) );
	}
}
