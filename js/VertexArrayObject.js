
import { GLObject } from "./GLObject.js";
import { IndexBufferObject } from "./IndexBufferObject.js";

export class VertexArrayObject extends GLObject {
    #vao;
    #vboList = {};
    #gpu;
    #ibo;
    indices;

    get hasIndices() {
        return !!this.#ibo;
    }

    get glObject() {
        return this.#vao;
    }

    constructor({gpu, attributes, indices = null}) {
        super();

        this.#gpu = gpu;

        const gl = this.#gpu.gl;
        this.#vao = gl.createVertexArray();

        // bind vertex array to webgl context
        gl.bindVertexArray(this.#vao);

        Object.keys(attributes).forEach(key => {
            const attribute = attributes[key];
            const { data, size, location, usageType, divisor } = attribute;
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); // static draw 固定
            gl.enableVertexAttribArray(location);
            // size ... 頂点ごとに埋める数
            // stride is always 0 because buffer is not interleaved.
            // ref: https://developer.mozilla.org/ja/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
            gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);

            if(divisor) {
                gl.vertexAttribDivisor(location, divisor);
            }

            this.#vboList[key] = { vbo };
        });

        if(indices) {
            this.#ibo = new IndexBufferObject({ gpu, indices })
            this.indices = indices;
        }

        // unbind vertex array to webgl context
        gl.bindVertexArray(null);

        // unbind array buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // unbind index buffer
        if(this.#ibo) {
            this.#ibo.unbind();
        }
    }

    updateAttribute(key, data) {
        const gl = this.#gpu.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}
