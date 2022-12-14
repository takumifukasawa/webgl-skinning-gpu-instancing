import {Matrix4} from "./Matrix4.js";

export class Bone {
    name;
    index;
    
    parent = null;
    children = [];

    offsetMatrix; // 初期姿勢のボーンローカル座標
    #poseMatrix; // 初期姿勢行列
    #boneOffsetMatrix; // 初期姿勢行列の逆行列
    #jointMatrix = Matrix4.identity();
   
    constructor({ name, index }) {
        this.name = name;
        this.index = index;
    }

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
    
    traverse(callback) {
        callback(this);
        this.children.forEach(child => {
            child.traverse(callback);
        })
    }
}