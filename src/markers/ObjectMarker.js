/*
 * This file is part of BlueMap, licensed under the MIT License (MIT).
 *
 * Copyright (c) Blue (Lukas Rieger) <https://bluecolored.de>
 * Copyright (c) contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import {Marker} from "./Marker";
import {CSS2DObject} from "../util/CSS2DRenderer";
import {animate, htmlToElement} from "../util/Utils";
import {Vector3} from "three";

export class ObjectMarker extends Marker {

    /**
     * @param markerId {string}
     */
    constructor(markerId) {
        super(markerId);
        Object.defineProperty(this, 'isObjectMarker', {value: true});
        this.markerType = "object";

        this.label = null;
        this.link = null;
        this.newTab = true;
    }

    onClick(event) {
        let pos = new Vector3();
        if (event.intersection) {
            pos.copy(event.intersection.pointOnLine || event.intersection.point);
            pos.sub(this.position);
        }

        if (this.label) {
            let popup = new LabelPopup(this.label);
            popup.position.copy(pos);
            this.add(popup);
            popup.open();
        }

        return true;
    }

    /**
     * @param markerData {{
     *      position: {x: number, y: number, z: number},
     *      label: string,
     *      link: string,
     *      newTab: boolean
     *      }}
     */
    updateFromData(markerData) {

        // update position
        let pos = markerData.position || {};
        this.position.setX(pos.x || 0);
        this.position.setY(pos.y || 0);
        this.position.setZ(pos.z || 0);

        // update label
        this.label = markerData.label || null;

        // update link
        this.link = markerData.link || null;
        this.newTab = !!markerData.newTab;

    }

}

export class LabelPopup extends CSS2DObject {

    /**
     * @param label {string}
     */
    constructor(label) {
        super(htmlToElement(`<div class="bm-marker-labelpopup">${label}</div>`));
    }

    /**
     * @param autoClose {boolean} - whether this object should be automatically closed and removed again on any other interaction
     */
    open(autoClose = true) {
        let targetOpacity = this.element.style.opacity || 1;

        this.element.style.opacity = 0;
        let inAnimation = animate(progress => {
            this.element.style.opacity = (progress * targetOpacity).toString();
        }, 300);

        if (autoClose) {
            let removeHandler = evt => {
                if (evt.composedPath().includes(this.element)) return;

                inAnimation.cancel();
                this.close();

                window.removeEventListener("mousedown", removeHandler);
                window.removeEventListener("touchstart", removeHandler);
                window.removeEventListener("keydown", removeHandler);
                window.removeEventListener("mousewheel", removeHandler);
            };

            window.addEventListener("mousedown", removeHandler);
            window.addEventListener("touchstart", removeHandler);
            window.addEventListener("keydown", removeHandler);
            window.addEventListener("mousewheel", removeHandler);
        }
    }

    /**
     * @param remove {boolean} - whether this object should be removed from its parent when the close-animation finished
     */
    close(remove = true) {
        let startOpacity = parseFloat(this.element.style.opacity);

        animate(progress => {
            this.element.style.opacity = (startOpacity - progress * startOpacity).toString();
        }, 300, completed => {
            if (remove && completed && this.parent) {
                this.parent.remove(this);
            }
        });
    }

}