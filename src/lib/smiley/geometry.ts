import {
  SOURCE_CENTER_X,
  SOURCE_CENTER_Y,
  SOURCE_RADIUS_X,
  SOURCE_RADIUS_Y,
} from "@/lib/smiley/constants";

export type SmileyMeshGeometry = {
  vertices: Float32Array;
  indices: Uint16Array;
};

export const createSmileyMeshGeometry = (segments: number): SmileyMeshGeometry => {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= segments; row += 1) {
    const rowRatio = row / segments;
    const localY = rowRatio * 2 - 1;

    for (let column = 0; column <= segments; column += 1) {
      const columnRatio = column / segments;
      const localX = columnRatio * 2 - 1;

      vertices.push(
        localX,
        localY,
        SOURCE_CENTER_X + localX * SOURCE_RADIUS_X,
        SOURCE_CENTER_Y + localY * SOURCE_RADIUS_Y,
      );
    }
  }

  const rowLength = segments + 1;

  for (let row = 0; row < segments; row += 1) {
    for (let column = 0; column < segments; column += 1) {
      const bottomLeft = row * rowLength + column;
      const bottomRight = bottomLeft + 1;
      const topLeft = bottomLeft + rowLength;
      const topRight = topLeft + 1;

      indices.push(bottomLeft, bottomRight, topLeft);
      indices.push(bottomRight, topRight, topLeft);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
};
