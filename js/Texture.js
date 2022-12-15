import {GLObject} from "./GLObject.js";
import {TextureFilterTypes, TextureTypes, TextureWrapTypes} from "./constants.js";

export class Texture extends GLObject {
    #texture;
    #img;
    #gpu;
    type;
    width;
    height;

    get glObject() {
        return this.#texture;
    }

    constructor({
        gpu,
        img,
        type = TextureTypes.RGBA,
        width, height,
        mipmap = false,
        minFilter = TextureFilterTypes.Nearest, magFilter = TextureFilterTypes.Nearest,
        wrapS = TextureWrapTypes.ClampToEdge, wrapT = TextureWrapTypes.ClampToEdge,
        flipY = false,
    }) {
        super();

        this.type = type;

        this.#gpu = gpu;
        const gl = this.#gpu.gl;

        this.#img = img || null;
        
        if(width) {
            this.width = width;
        }
        if(height) {
            this.height = height;
        }

        if(!this.#img && (!this.width || !this.height)) {
            console.error("[Texture.constructor] invalid width or height")
        }

        this.#texture = gl.createTexture();

        // bind texture object to gl
        gl.bindTexture(gl.TEXTURE_2D, this.#texture);

        // mipmap settings
        if (mipmap) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }

        // filter
        // filterable ref: https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html
        switch(this.type) {
            case TextureTypes.RGBA:
            case TextureTypes.RGBA32F:
                // min filter settings
                switch(minFilter) {
                    case TextureFilterTypes.Nearest:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                        break;
                    case TextureFilterTypes.Linear:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                        break;
                    default:
                        throw "invalid min filter type"
                }
                // mag filter settings
                switch(magFilter) {
                    case TextureFilterTypes.Nearest:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                        break;
                    case TextureFilterTypes.Linear:
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        break;
                    default:
                        throw "invalid mag filter type"
                }
                break;

            // rgba32fはfilterできない 
            case TextureTypes.RGBA32F:
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                break;

            default:
                throw "invalid texture type";
        }

        // wrap settings
        switch(wrapS) {
            case TextureWrapTypes.ClampToEdge:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                break;
            case TextureWrapTypes.Repeat:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                break;
        }
        switch(wrapT) {
            case TextureWrapTypes.ClampToEdge:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                break;
            case TextureWrapTypes.Repeat:
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                break;
        }

        if (!!this.#img || flipY) {
            // uv座標そのものは左下からなのでglもそれに合わせるためにflip
            // html image coord -> gl texture coord
            // (0, 0) - (1, 0)     (0, 1) - (1, 1)
            //   |         |         |         |
            // (0, 1) - (1, 1)     (0, 0) - (1, 0)
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        } else {
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        }

        switch(this.type) {
            case TextureTypes.RGBA:
                if (this.width && this.height) {
                    // for render target
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
                } else {
                    // set img to texture
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
                }
                break;

            case TextureTypes.RGBA32F:
                if (this.width && this.height) {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.width, this.height, 0, gl.RGBA, gl.FLOAT, this.#img);
                } else {
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.RGBA, gl.FLOAT, this.#img);
                }
                break;

            default:
                throw "[Texture.constructor] invalid type";
        }

        // TODO: あった方がよい？
        // unbind img
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    setSize(width, height) {
        const gl = this.#gpu.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.#texture);
        
        this.width = width;
        this.height = height;

        // bind texture data
        switch(this.type) {
            case TextureTypes.RGBA:
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.#img);
                break;

            case TextureTypes.RGBA32F:
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.width, this.height, 0, gl.RGBA, gl.FLOAT, this.#img);
                break;

            default:
                throw "[Texture.setSize] invalid type";
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    setData(data) {
        const gl = this.#gpu.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.#texture);
        
        switch(this.type) {
            case TextureTypes.RGBA32F:
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.width, this.height, 0, gl.RGBA, gl.FLOAT, data);
                break;
            default:
                throw "[Texture.update] invalid type";
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}