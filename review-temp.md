
🔴 Trialware and Locked Features
Please review your plugin to ensure that it does not include any locked or restricted built-in functionality. This is not permitted under the WordPress.org Plugin Directory Guidelines you agreed to when submitting the plugin.

❌ Guideline 5 – Trialware
Plugins must be fully functional. You may not:

    Lock, disable or limit built-in features behind a license key, trial period, usage limit, time, quota or any other kind of intended restriction.


Even if the locked feature is present in the code "just in case the user upgrades," it’s still not allowed. Your plugin may point out which features are available through a separated plugin, but that's it. All plugin code hosted on WordPress.org must be free and fully functional.

🌐 Guideline 6 – Serviceware
Plugins may connect to a legitimate external service to perform certain functionality, provided:

    The service performs actual processing on external servers.
    The functionality provided cannot be done locally by the plugin.
    The service is clearly documented in your readme, including Terms of Use and Privacy Policy links.


For example: a "Spam checker" plugin that connects to a external service to check for spam (and thus uses it to provide that functionality) is generally acceptable. A plugin that simply checks a license key to unlock local features is not.

✅ Ask yourself:

    Does any function only work after a license check or payment?
    Is any functionality in the plugin code disabled or limited until it’s unlocked?
    Are there any limitations on the plugin after a certain amount of time or usage?


After excluding functionalities provided by legitimate external services, if the answer is yes to any of the above, the plugin does not comply.

🔧 How to fix it:

    Remove all license checks or other mechanisms that control access to features built in in the plugin code.
    Remove or fully enable any built in features that are currently locked or limited.
    Make sure external services are compliant and clearly documented.


ℹ️ Important clarification:
WordPress.org is not a marketplace. It's a repository for free, fully functional, GPL-compliant plugins.

If you are not offering a service and want to offer additional features through a paid version, that code must be:

    Hosted elsewhere (e.g., your own website).
    Not included in the plugin hosted on WordPress.org.
    GPL compliant: Do not include any mechanisms that would prevent a plug-in from being used after a license has been checked.


✨ Multiple-wishlist creation, renaming, deletion, and list visibility are implemented in ListsController but intentionally blocked unless the flexa_wishlist/pro/is_licensed filter returns true.


⚠️ The AI has highlighted the most apparent issues. There may be additional concerns not explicitly mentioned. You must read and comprehend the guidelines and review the entire code thoroughly to ensure that there are no other issues.
❗ If more issues of the same nature are found in the following review, this plugin will not be reviewed again. Ensure full compliance with the guidelines to avoid rejection.

🔴️ Attempting to process custom CSS/JS/PHP / Allowing arbitrary script insertion.

We no longer permit plugins to allow users to save arbitrary custom CSS, JavaScript, or PHP within the plugin.

The primary reason for this is that WordPress includes it's own, robust, error-checking, CSS editor in the Customizer or Editor already. Any time your plugin replicates functionality found in WordPress (i.e. the uploader, jquery) is frowned upon, as it presents a possible security risk. The features in WordPress have been tested by many more people than use most plugins, so the built in tools are less likely to have issues.

As for JavaScript, we recognize that script insertion plugins are amazing and powerful. They're also incredibly dangerous and require a high level understanding of sanitization, security, and usage. And in the case of most plugins, these are entirely unnecessary.

You should never be asking users to paste in arbitrary JavaScript. Instead, have them paste in the values custom to their scripts and generate the rest programmatically.

Also, if you are asking for code to make customization, make that a form instead. Besides security, you can't expect your users to know how to code.

PHP is even more complex. This is why WordPress itself allows you to lock people out of being able to edit theme and plugin files directly (via DEFINES that are used by many managed hosts), but also has a serious of post-processing checks that verify the site will still function after any changes.

Please, remove arbitrary code insertion from your plugin.

✨ The Appearance custom_css setting accepts arbitrary CSS and outputs it inline in a style block, with only insufficient string-based filtering.



Other details

We've detected some other details that you may want to check.

🔴️ Check permission_callback in REST API Route

When using register_rest_route() or wp_register_ability() to define custom REST API endpoints, it is crucial to include a proper permission_callback.

🔒 This callback function ensures that only authorized users can access or modify data through your endpoint.

Code example, checking that the user can change options:

register_rest_route( 'flexa-wishlist-for-woocommerce/v1', '/my-endpoint', array(
    'methods' => 'GET',
    'callback' => 'flexa-wishlist-for-woocommerce_callback_function',
    'permission_callback' => function() {
        return current_user_can( 'manage_options' );
    }
) );


Please check the register_rest_route() documentation and the current_user_can() documentation.

✅ When a permission_callback is NOT Required:

There are valid use cases for public endpoints, such as publicly available data (e.g., posts, public metadata) or endpoints designed for unauthenticated access (e.g., fetching public stats or information).

In these cases, you should use __return_true as the permission_callback to indicate that the endpoint is intentionally public.

🔒 When a permission_callback IS Required:

For endpoints that involve sensitive data or actions (e.g., getting not public data, creating, updating, or deleting content).

In these cases, you should always implement proper permission checks.

Possible cases found on this plugin's code:

src/Rest/ItemsController.php:42 register_rest_route(self::NAMESPACE, '/items/toggle', ['methods' => WP_REST_Server::CREATABLE, 'callback' => [$this, 'toggle'], 'permission_callback' => [$this, 'storefront_write_permission'], 'args' => $this->add_args()]);
# ↳ Detected: storefront_write_permission
# ✨ An explicit listId is used to locate and delete an item without first verifying that the list belongs to the current owner, allowing removal from another wishlist if its ID and item key are known.


