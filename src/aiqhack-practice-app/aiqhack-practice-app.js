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
                canvas{
                    background-color: #000;
                }
                
                .canvas-image {
                    height: 35px;
                    width: 35px;
                    background-color: rgba(0,0,0,1);
                    border-radius: 5px;
                    padding: 5px;
                }

                img {
                    max-width: 100%;
                    display: block;
                    margin: 0 auto;
                } 
            </style>
            <h2>Handwritten character recognition</h2>
            <div>
                <paper-button on-tap="_clear">Clear</paper-button>
                <paper-button on-tap="_predict">Predict</paper-button>
            </div>
            <div>
                <canvas id="blackboard" width="280" height="280" />
            </div>
            <div>
                <img src$="[[data]]" id="canvas_image" class="canvas-image"/>
            </div>
    `;
    }

    static get properties() {
        return {
            ctx: {
                type: Object,
                computed: '_getContext()'
            },
            canvasStrokeStyle: {
                type: String,
                value: 'white'
            },
            canvasLineJoin: {
                type: String,
                value: 'round'
            },
            canvasLineWidth: {
                type: Number,
                value: 12
            },
            _clickX : {
                type: Array,
                value: () => []
            },
            _clickY  : {
                type: Array,
                value: () => []
            },
            _clickD   : {
                type: Array,
                value: () => []
            },
            _drawing: {
                type: Boolean,
                value: false
            }
        };
    }

    ready() {
        super.ready();

        this.$.blackboard.addEventListener('mousemove', (e) => {
            if(this._drawing) {
                const mouseX = e.clientX - this.$.blackboard.offsetLeft;
                const mouseY = e.clientY - this.$.blackboard.offsetTop;
                this._addUserGesture(mouseX, mouseY, true);
                this._drawOnCanvas();
            }
        }, false);
        this.$.blackboard.addEventListener('mousedown', (e) => {
            const mouseX = e.clientX - this.$.blackboard.offsetLeft;
            const mouseY = e.clientY - this.$.blackboard.offsetTop;

            this._drawing = true;
            this._addUserGesture(mouseX, mouseY);
            this._drawOnCanvas();
        }, false);
        this.$.blackboard.addEventListener('mouseup', () => {
            this._drawing = false;
        }, false);
        this.$.blackboard.addEventListener('mouseleave', () => {
            this._drawing = false;
        }, false);
    }

    _addUserGesture(x, y, dragging) {
        this._clickX.push(x);
        this._clickY.push(y);
        this._clickD.push(dragging);
    }

    _drawOnCanvas() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        this.ctx.strokeStyle = this.canvasStrokeStyle;
        this.ctx.lineJoin    = this.canvasLineJoin;
        this.ctx.lineWidth   = this.canvasLineWidth;

        for (let i = 0; i < this._clickX.length; i++) {
            this.ctx.beginPath();
            if(this._clickD[i] && i) {
                this.ctx.moveTo(this._clickX[i-1], this._clickY[i-1]);
            } else {
                this.ctx.moveTo(this._clickX[i]-1, this._clickY[i]);
            }
            this.ctx.lineTo(this._clickX[i], this._clickY[i]);
            this.ctx.closePath();
            this.ctx.stroke();
        }
    }

    async _predict(){
        const model = await tf.loadModel('/model/model.json');

        //get image data
        const digitData = this._boundingBox();

        let tensor = tf.fromPixels(digitData)
            .resizeNearestNeighbor([28, 28])
            .mean(2)
            .expandDims(2)
            .expandDims()
            .toFloat()
            .div(255.0);

        const predictions = await model.predict(tensor);
        let result = predictions.as1D().argMax();
        const digit = (await result.data())[0];

        alert(digit);
    }

    _clear(){
        this.ctx.clearRect(0, 0, this.$.blackboard.width, this.$.blackboard.height);
        this._clickX = new Array();
        this._clickY = new Array();
        this._clickD = new Array();
    }

    _getContext() {
        return this.$.blackboard.getContext('2d');
    }

    _boundingBox() {
        const minX = Math.min.apply(Math, this._clickX) - 20;
        const maxX = Math.max.apply(Math, this._clickX) + 20;

        const minY = Math.min.apply(Math, this._clickY) - 20;
        const maxY = Math.max.apply(Math, this._clickY) + 20;

        const tempCanvas = document.createElement("canvas"),
            tCtx = tempCanvas.getContext("2d");

        tempCanvas.width  = maxX - minX;
        tempCanvas.height = maxY - minY;

        tCtx.drawImage(this.$.blackboard, minX, minY, maxX - minX, maxY - minY, 0, 0, maxX - minX, maxY - minY);

        this.data = tempCanvas.toDataURL();

        return tempCanvas;
    }
}

window.customElements.define('aiqhack-practice-app', AiqhackPracticeApp);
