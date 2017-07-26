/**
 * This class was created to avoid permanently checking of the debug options
 *
 * Created by Steve on 01.11.2016.
 */
class SenseConsole {
    /**
     * Create an instance
     *
     * @param {{debug: Boolean}} options
     */
    constructor (options) {
        this._options = options || {};
    }
    /**
     * Set new options
     *
     * @param {{debug: Boolean}} newOptions
     */
    set options(newOptions) {
        if (newOptions && newOptions.debug) {
            this._options.debug = newOptions.debug;
        } else {
            this._options = {};
        }
    }
    /**
     * Get the options
     *
     * @return {{debug: Boolean}} newOptions
     */
    get options() {
        return this._options;
    }
    /**
     * Emulate the function console.log
     *
     * @param {*} args
     */
    log(...args) {
        if (this.options.debug) {
            let trace = this.stack();
            trace && args.push(trace);
            console.log.apply(null, args);
        }
    }
    /**
     * Emulate the function console.info
     *
     * @param {*} args
     */
    info(...args) {
        if (this.options.debug) {
            let trace = this.stack();
            trace && args.push(trace);
            console.info.apply(null, args);
        }
    }
    /**
     * Emulate the function console.trace
     *
     * @param {*} args
     */
    trace(...args) {
        if (this.options.debug) {
            let trace = this.stack();
            trace && args.push(trace);
            console.trace.apply(null, args);
        }
    }
    /**
     * Emulate the function console.warn
     *
     * @param {*} args
     */
    warn(...args) {
        if (this.options.debug) {
            let trace = this.stack();
            trace && args.push(trace);
            console.warn.apply(null, args);
        }
    }
    /**
     * Emulate the function console.error
     *
     * @param {*} args
     */
    error(...args) {
        if (this.options.debug) {
            let trace = this.stack();
            trace && args.push(trace);
            console.error.apply(null, args);
        }
    }
    /**
     * Get the latest function before call the function of this class
     * to get understanding which it is called from
     *
     * @return {String|Null}
     */
    stack() {
        var stack, e;
        try {
            e = new Error('dummy');
            stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
                .replace(/^\s+at\s+/gm, '')
                .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                .split('\n');
        } catch (err) { err; }
        return (stack[2] || null);
    }
}
