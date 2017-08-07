/**
 * Declares the core object "sm" of the library and includes essential helper functions.
 */
const sm = function() {
    const sm = {
        host: "http://bigdata.mdx.ac.uk/",
        // host: "http://localhost/",
        vis: {},
        layout: {},
        provenance: {},
        data: {
            tree: {} // real data
        },
        model: {},
        view: {},
        misc: {}
    };

    return sm;
}();