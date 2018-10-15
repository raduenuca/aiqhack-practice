import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-card/paper-card.js';
import '@polymer/paper-button/paper-button.js';

import * as tf from '@tensorflow/tfjs';

/**
 * @customElement
 * @polymer
 */
class AiqhackPracticeApp extends PolymerElement {
    static get template() {
        return html`
            <style>
                :host {
                  display: block;
                }
            </style>
            <h2>Handwritten character recognition</h2>
            <div>
                <paper-button on-tap="_clear">Clear</paper-button>
                <paper-button on-tap="_predict">Predict</paper-button>
            </div>
            <canvas id="blackboard" width="280" height="280" />
    `;
    }

    static get properties() {
        return {
            ctx: {
                type: Object,
                computed: '_getContext()'
            },
            penColor: {
                type: String,
                value: 'white'
            },
            penLine: {
                type: String,
                value: 'round'
            },
            penSize: {
                type: Number,
                value: 12
            },
            _flag: {
                type: Boolean,
                value: false
            },
            _dot_flag: {
                type: Boolean,
                value: false
            },
            _prevX: {
                type: Number,
                value: 0
            },
            _currX: {
                type: Number,
                value: 0
            },
            _prevY: {
                type: Number,
                value: 0
            },
            _currY: {
                type: Number,
                value: 0
            },
        };
    }

    ready() {
        super.ready();

        this.$.blackboard.addEventListener('mousemove', (e) => {
            this._findxy('move', e)
        }, false);
        this.$.blackboard.addEventListener('mousedown', (e) => {
            this._findxy('down', e)
        }, false);
        this.$.blackboard.addEventListener('mouseup', (e) => {
            this._findxy('up', e)
        }, false);
        this.$.blackboard.addEventListener('mouseout', (e) => {
            this._findxy('out', e)
        }, false);
    }

    async _predict(){
        const model = await tf.loadModel('/model/model.json');

        //get image data
        const digitData = this.ctx.getImageData(0, 0, 280, 280);

        let tensor = tf.fromPixels(this.$.blackboard)
            .resizeNearestNeighbor([28, 28])
            .mean(2)
            .expandDims(2)
            .expandDims()
            .toFloat()
            .div(255.0);

        const prediction = await model.predict(tensor).data();

        let results = Array.from(prediction);

        console.log(results);
    }

    _clear(){
        const canvas = this.$.blackboard;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    _getContext() {
        const canvas = this.$.blackboard;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return ctx;
    }

    _findxy(res, e) {
        const canvas = this.$.blackboard;
        if (res === 'down') {
            this._prevX = this._currX;
            this._prevY = this._currY;
            this._currX = e.clientX - canvas.offsetLeft;
            this._currY = e.clientY - canvas.offsetTop;

            this._flag = true;
            this._dot_flag = true;
            if (this._dot_flag) {
                this.ctx.beginPath();
                this.ctx.fillStyle = this.penColor;
                this.ctx.fillRect(this._currX, this._currY, 2, 2);
                this.ctx.closePath();
                this._dot_flag = false;
            }
        }
        if (res === 'up' || res === "out") {
            this._flag = false;
        }
        if (res === 'move') {
            if (this._flag) {
                this._prevX = this._currX;
                this._prevY = this._currY;
                this._currX = e.clientX - canvas.offsetLeft;
                this._currY = e.clientY - canvas.offsetTop;
                this._draw();
            }
        }
    }

    _draw() {
        this.ctx.beginPath();
        this.ctx.moveTo(this._prevX, this._prevY);
        this.ctx.lineTo(this._currX, this._currY);
        this.ctx.strokeStyle = this.penColor;
        this.ctx.lineJoin  = this.penLine;
        this.ctx.lineWidth = this.penSize;
        this.ctx.stroke();
        this.ctx.closePath();
    };
}

window.customElements.define('aiqhack-practice-app', AiqhackPracticeApp);
