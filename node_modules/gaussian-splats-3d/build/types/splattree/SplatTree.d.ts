export class SplatTree {
    constructor(maxDepth: any, maxPositionsPerNode: any);
    maxDepth: any;
    maxPositionsPerNode: any;
    splatBuffer: any;
    sceneDimensions: any;
    sceneMin: any;
    sceneMax: any;
    rootNode: SplatTreeNode;
    addedIndexes: {};
    nodesWithIndexes: any[];
    processSplatBuffer(splatBuffer: any, filterFunc?: () => boolean): void;
    processNode(node: any, splatBuffer: any): void;
    countLeaves(): number;
    visitLeaves(visitFunc: any): void;
}
import { SplatTreeNode } from "./SplatTreeNode.js";
