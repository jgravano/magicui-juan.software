export function canOpenCover(visible,position,target){return !visible||(target===1&&position>=.95);}
export function canFastenElastic(open,target,dragging){return !dragging&&open<=.015&&target===0;}
export function elasticDropTarget(start,x,edge,closed,cancel=false){if(cancel||!closed)return start;return start===0?(x>edge+.035?1:0):(x<edge-.08?0:1);}
