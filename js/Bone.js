import {Matrix4} from "./Matrix4.js";

export class Bone {
    parent = null;
    children = [];

    offsetMatrix; // 親ボーンに対する相対的な姿勢
    #poseMatrix; // ローカル空間における初期姿勢行列
    #boneOffsetMatrix; // ローカル空間における初期姿勢行列の逆行列（= ボーンオフセット行列）
    #jointMatrix = Matrix4.identity(); // ローカル空間における現在の姿勢行列
   
    get childCount() {
        return this.children.length;
    }

    get hasChild() {
        return this.childCount > 0;
    }

    addChild(child) {
        this.children.push(child);
        child.parent = this;
    }
   
    get boneOffsetMatrix() {
        return this.#boneOffsetMatrix;
    }
    
    get poseMatrix() {
        return this.#poseMatrix;
    }
    
    get jointMatrix() {
        return this.#jointMatrix;
    }
    
    calcBoneOffsetMatrix(parentBone) {
        this.#poseMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.poseMatrix, this.offsetMatrix)
            : this.offsetMatrix;
        this.#boneOffsetMatrix = this.#poseMatrix.clone().invert();
        this.children.forEach(childBone => childBone.calcBoneOffsetMatrix(this));
    }
    
    calcJointMatrix(parentBone) {
        this.#jointMatrix = !!parentBone
            ? Matrix4.multiplyMatrices(parentBone.jointMatrix, this.offsetMatrix)
            : this.offsetMatrix;
        this.children.forEach(childBone => childBone.calcJointMatrix(this));
    }
}