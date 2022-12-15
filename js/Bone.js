import {Matrix4} from "./Matrix4.js";

export class Bone {
    name;
    index;
    
    parent = null;
    children = [];

    offsetMatrix; //ボーンローカル座標系の初期姿勢
    #poseMatrix; // ローカル座標系の初期姿勢行列
    #boneOffsetMatrix; // ローカル座標系の初期姿勢行列の逆行列
    #jointMatrix = Matrix4.identity(); // ローカル座標系の姿勢行列
   
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
}