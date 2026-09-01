Have you checked for common technical issues?

Please ensure that your plugin adheres to the guidelines and best practices, including the following:

🔴 Use wp_enqueue commands

ℹ️ Why it matters: Because of performance and compatibility, please make use of the built in functions for including static and dynamic JS and/or CSS.

🔍 Identify JS and CSS outputs: Look for any <script> or <style> HTML tags in your plugin. In the majority of cases you could enqueue them.

🛠 Fix it: Make use of the specific function for enqueue them:
Type of code 	Functions
Static JS 	wp_register_script(), wp_enqueue_script(), admin_enqueue_scripts()
Inline JS 	wp_add_inline_script()
Static CSS 	wp_register_style(), wp_enqueue_style()
Inline CSS 	wp_add_inline_style()

👉 In the public pages you can enqueue them using the hook wp_enqueue_scripts().
👉 In the admin pages you can enqueue them using the hook admin_enqueue_scripts(). You can also use admin_print_scripts() and admin_print_styles().
👉 As of WordPress 6.3, you can easily pass attributes like defer or async, as of WordPress 5.7, you can pass other attributes by using functions and filters.

Example:

function flexseae_enqueue_script() {
    wp_enqueue_script( 'flexseae_js', plugins_url( 'inc/main.js', __FILE__ ), array(), FLEXSEAE_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'flexseae_enqueue_script' );

Your JS/CSS is now enqueued!

Possible cases from your plugin include:

templates/sitemap/stylesheet.php:34 <style>