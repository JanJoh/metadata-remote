/*
 * Home Assistant ingress support.
 *
 * When the app runs behind HA ingress it is served under a base path
 * (e.g. /api/hassio_ingress/<token>). Root-relative URLs the browser requests
 * ("/tree/", "/stream/...", "/static/...") must be prefixed with that base
 * path. This module exposes a helper and transparently rewrites fetch() calls.
 *
 * When accessed directly (no ingress) INGRESS_PATH is empty and everything is
 * a no-op, preserving the original behavior.
 */
(function() {
    window.MetadataRemote = window.MetadataRemote || {};

    var base = (window.INGRESS_PATH || '').replace(/\/+$/, '');

    /**
     * Prefix a root-relative app path with the ingress base path.
     * Leaves absolute (http/https), protocol-relative, data:/blob: and
     * already-prefixed URLs untouched.
     */
    function ingressUrl(url) {
        if (!base || typeof url !== 'string') return url;
        if (url.charAt(0) !== '/' || url.charAt(1) === '/') return url;
        if (url === base || url.indexOf(base + '/') === 0) return url;
        return base + url;
    }
    window.MetadataRemote.ingressUrl = ingressUrl;

    // Transparently prefix all fetch() requests so the API layer needs no changes.
    if (base && typeof window.fetch === 'function') {
        var origFetch = window.fetch.bind(window);
        window.fetch = function(input, init) {
            if (typeof input === 'string') {
                input = ingressUrl(input);
            } else if (input && typeof input.url === 'string') {
                input = new Request(ingressUrl(input.url), input);
            }
            return origFetch(input, init);
        };
    }
})();
