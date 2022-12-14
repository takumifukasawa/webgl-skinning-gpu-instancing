
import { PrimitiveTypes, UniformTypes } from "./constants.js";

export class GPU {
    gl;
    #shader;
    #vao;
    #uniforms;

    constructor({ gl }) {
        this.gl = gl;
    }

    setShader(shader) {
        this.#shader = shader;
    }

    setVertexArrayObject(vao) {
        this.#vao = vao;
    }

    setUniforms(uniforms) {
        this.#uniforms = uniforms;
    }

    setSize(x, y, width, height) {
        this.gl.viewport(x, y, width, height);
    }
    
    setFramebuffer(framebuffer) {
        const gl = this.gl;
        !!framebuffer
            ? gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.glObject)
            : gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    flush() {
        this.gl.flush();
    }

    clear(r, g, b, a) {
        const gl = this.gl;
        // TODO: mask設定は外側からやった方がよい気がする
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    #getGLPrimitive(primitiveType) {
        const gl = this.gl;
        switch (primitiveType) {
            case PrimitiveTypes.Points:
                return gl.POINTS;
            case PrimitiveTypes.Lines:
                return gl.LINES;
            case PrimitiveTypes.Triangles:
                return gl.TRIANGLES;
            default:
                throw "invalid primitive type";
        }
    }
  
    draw({ drawCount, instanceCount = 0, startOffset = 0 }) {
        const gl = this.gl;
      
        // culling
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        gl.frontFace(gl.CCW);

        // depth write
        gl.depthMask(true);

        // depth test
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // blend
        gl.disable(gl.BLEND);

        gl.useProgram(this.#shader.glObject);
        
        const setUniformValue = (type, uniformName, value) => {
            const gl = this.gl;
            const location = gl.getUniformLocation(this.#shader.glObject, uniformName);
            // TODO: nullなとき,値がおかしいときはセットしない
            switch(type) {
                case UniformTypes.Int:
                    gl.uniform1i(location, value);
                    break;
                case UniformTypes.Float:
                    gl.uniform1f(location, value);
                    break;
                case UniformTypes.Vector2:
                    gl.uniform2fv(location, value.elements);
                    break;
                case UniformTypes.Vector3:
                    gl.uniform3fv(location, value.elements);
                    break;
                case UniformTypes.Matrix4:
                    // arg[1] ... use transpose.
                    gl.uniformMatrix4fv(location, false, value.elements);
                    break;
                case UniformTypes.Matrix4Array:
                    if(value) {
                        // arg[1] ... use transpose.
                        gl.uniformMatrix4fv(location, false, value.map(v => [...v.elements]).flat());
                    }
                    break;
                default:
                    throw `invalid uniform - name: ${uniformName}, type: ${type}`;
            }
        };
 
        // uniforms
        if(this.#uniforms) {
            Object.keys(this.#uniforms).forEach(uniformName => {
                const uniform = this.#uniforms[uniformName];
                if(uniform.type === UniformTypes.Struct) {
                    Object.keys(uniform.value).forEach(key => {
                        setUniformValue(uniform.value[key].type, `${uniformName}.${key}`, uniform.value[key].value)
                    });
                } else {
                    setUniformValue(uniform.type, uniformName, uniform.value);
                }
            });
        }
        
        // set vertex
        gl.bindVertexArray(this.#vao.glObject);
        
        // プリミティブは三角形に固定
        const glPrimitiveType = gl.TRIANGLES;

        // draw
        if (this.#vao.hasIndices) {
            // draw by indices
            // drawCount ... use indices count
            // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.#ibo.glObject);
            if(instanceCount) {
                gl.drawElementsInstanced(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset, instanceCount)
            } else {
                gl.drawElements(glPrimitiveType, drawCount, gl.UNSIGNED_SHORT, startOffset);
            }
        } else {
            // draw by array
            // draw count ... use vertex num
            if(instanceCount) {
                gl.drawArraysInstanced(glPrimitiveType, startOffset, drawCount, instanceCount);
            } else {
                gl.drawArrays(glPrimitiveType, startOffset, drawCount);
            }
        }
    }
}
