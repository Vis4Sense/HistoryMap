/**
 * This class was created to use Zip functionality in the application
 *
 * Created by Steve on 17.12.2016.
 */
class SenseZip {
    /**
     * Create a new instance and link it with SenseHistory
     *
     * @param {SenseHistory} senseHistory
     * @param {Array} [zipContent]
     * @param {Function} [callback]
     */
    constructor(senseHistory, zipContent, callback) {
        // Check if we need to extract existing zip file
        if (zipContent) {
            this.zip = new JSZip(zipContent);
        } else {
            // prepare a new data
            this.zip = new JSZip();
            this.savedImages = {};
        }
        this.senseHistory = senseHistory;
        if (typeof callback == 'function') {
            this[zipContent ? 'extractZip' : 'makeZip'](callback);
        }
    }
    /**
     * Images: replace dataURL with local files to reduce the size of main file
     */
    convertImages2Files() {
        // Pass the array exportedNodes and memorized all the file names
        this.nodes.filter(d => d.image).forEach(d => { this.image2File(d); });
        // Pass the array actions
        this.actions.filter(d => d.image).forEach(d => { this.image2File(d); });
    }
    /**
     * Prepare data from the SenseHistory instance and callback with prepared data
     *
     * @param {Function} callback
     */
    makeZip(callback) {
        // coreData
        this.actions = this.senseHistory.actions.map(SenseNode.getCoreData);
        // exportedNodes
        this.nodes = this.senseHistory.export;
        this.convertImages2Files();
        // Main file
        this.zip.file('description', this.senseHistory.description);
        this.zip.file('sensemap.json', JSON.stringify({data: this.actions}, null, 4));
        this.zip.file('sensenodes.json', JSON.stringify(this.nodes, null, 4));
        // Browsing file
        this.zip.file('browser.json', JSON.stringify({data: this.senseHistory.browsingActions}, null, 4));
        if (typeof callback == 'function') {
            callback({
                filename: this.id2filename(this.senseHistory.id),
                description: this.senseHistory.description,
                timestamp: +this.senseHistory.id,
                uint8arr: this.zip.generate({type: 'uint8array'})
            });
        }
    }
    /**
     * Prepare data from the external data and callback with prepared data
     *
     * @param {{actions: Array, nodes: Array, creationTime: String, name: String}} content
     * @param {Function} [callback]
     */
    makeZipFromAPI(content, callback) {
        var id = Date.parse(content.creationTime);
        this.actions = content.actions.slice();
        this.nodes = content.nodes.slice();
        this.convertImages2Files();
        this.zip.file('description', content.name);
        this.zip.file('sensemap.json', JSON.stringify({data: this.actions}, null, 4));
        this.zip.file('sensenodes.json', JSON.stringify(this.nodes, null, 4));
        // Browsing file
        this.zip.file('browser.json', JSON.stringify({data: []}, null, 4));
        if (typeof callback == 'function') {
            callback({
                filename: this.id2filename(id),
                description: content.name,
                timestamp: +id,
                zipBlob: this.zip.generate({type: 'blob'})
            });
        }
    }
    /**
     * Load a session from the zipped content and store it to the SenseHistory
     *
     * @param {Function} [callback]
     */
    extractZip(callback) {
        this.senseHistory.clearHistory().then(() => {
            // Try to read description
            try {
                this.senseHistory.description = zip.file('description').asText();
            } catch (e) {
                this.senseHistory.description = 'Loaded from external files';
            }
            this.senseHistory.export = JSON.parse(this.zip.file('sensenodes.json').asText());
            this.senseHistory.actions = JSON.parse(this.zip.file('sensemap.json').asText()).data;
            // Replace in the array nodes the field 'image' by converted files from zip
            Object.keys(this.zip.files).filter(entry => entry.match(/^images\/.+/)).forEach(entry => {
                var f = this.zip.files[entry],
                    node = this.senseHistory.senseNodes.find(a => a.image === f.name.split('/')[1]);
                if (node) {
                    // Don't use blob: it makes it unable to re-save image file
                    let bf = this.zip.file(f.name).asArrayBuffer();
                    node.image = 'data:image/png;base64,';
                    node.image += btoa([].reduce.call(new Uint8Array(bf), (p, c) => p + String.fromCharCode(c), ''));
                }
            });
            if (typeof callback == 'function') {
                callback();
            }
        });
    }
    /**
     * Create a entry file in a zip if it is not exist and/or replace the field image to the filename of that file
     *
     * @param {SenseNode} d
     */
    image2File(d) {
        if (this.savedImages[d.id]) {
            d.image = this.savedImages[d.id];
        } else if (d.image.startsWith('data')) {
            let filename = d.id + '.png';
            // base64 data doesn't have 'data:image/png;base64,'
            this.zip.folder('images').file(filename, d.image.split('base64,')[1], {base64: true});
            d.image = filename;
            this.savedImages[d.id] = filename;
        }
    }
    /**
     * Make a filename using id
     *
     * @param {Number|String} id
     * @return {string}
     */
    id2filename(id) {
        return id + '-sensemap.zip';
    }
    /**
     * Read the content of the uploaded file
     *
     * @param {Object} target
     * @param {Function} callback
     */
    static readUploadedFile(target, callback) {
        var f = target.files[0];
        if (f) {
            let reader = new FileReader();
            reader.readAsArrayBuffer(f);
            reader.onload = function(e) {
                callback(e.target.result, f.name.split('-')[0]);
            };
        }
    }
    /**
     * Save data to local file
     *
     * @param {String} filename
     * @param {Object} data
     */
    static saveDataToFile(filename, data) {
        var link = document.createElement('a'), objectData;
        document.body.appendChild(link);
        link.style.display = 'none';
        link.setAttribute('download', filename);
        objectData = data instanceof Blob ? data : new Blob([JSON.stringify(data, null, 4)], {type: 'application/zip'});
        link.setAttribute('href', URL.createObjectURL(objectData));
        link.click();
        document.body.removeChild(link);
    }
}
