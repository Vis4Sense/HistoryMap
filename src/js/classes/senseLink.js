// import { SenseURL }  from './senseUrl';
/**
 * Created by steve on 8/31/16.
 */
class SenseLink {
    /**
     * Create a link between two nodes
     *
     * @param {SenseURL} src
     * @param {SenseURL} dst
     * @param {String} [title]
     */
    constructor(src, dst, title) {
        this.srcNode = src;
        this.dstNode = dst;
        this.title = title;
        this.place = {};
    }
    /**
     * Destroy the link between two nodes
     */
    destroyItself() {
        this.srcNode = undefined;
        this.dstNode = undefined;
    }
    /**
     * Return id of the link
     *
     * @param {Object} link
     * @returns {string}
     */
    static linkId(link) {
        return 'l-' + link.source.id + '-' + link.target.id;
    }
    /**
     * Return id of the hovered link
     *
     * @param {Object} link
     * @returns {string}
     */
    static linkHoverId(link) {
        return 'h' + SenseLink.linkId(link);
    }
    /**
     * Return id of the link title
     *
     * @param {Object} link
     * @returns {string}
     */
    static linkTitleId(link) {
        return 't' + SenseLink.linkId(link);
    }
    /**
     * Show/Hide edge's menu
     *
     * @param {Boolean} visible
     * @param {Object} self
     * @param {Object} link
     * @param {Boolean} dragging
     */
    static menu(visible, self, link, dragging) {
        var titleOffset = 0, title = d3.select(self).select('.input-container'),
            t = [
                link.rpoints[0].x + (link.rpoints[1].x - link.rpoints[0].x) / 2,
                link.rpoints[0].y + (link.rpoints[1].y - link.rpoints[0].y) / 2
            ];
        // Link feedback
        d3.select(self).select('.main-link').classed('hovered', visible);
        if (title.node()) {
            titleOffset = title.node().getBoundingClientRect().width / 2;
        }
        d3.select(self).select('.btn-group').classed('hide', !visible || dragging);

        // Menu: show it at the middle of the link : sometimes, menu disappear along the way
        var btnGroup = d3.select(self).select('.btn-group').node().getBoundingClientRect();
        if (titleOffset) {
            t[0] = Math.round(t[0] + titleOffset);
        } else {
            t[0] = Math.round(t[0] - btnGroup.width / 2);
        }
        t[1] = Math.round(t[1] - btnGroup.height / 2);
        d3.select(self).select('.menu-container').attr('transform', 'translate(' + t + ')');
    }
}
