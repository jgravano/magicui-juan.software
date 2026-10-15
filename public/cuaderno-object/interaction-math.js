export function pinchZoom(startZoom,startDistance,distance){
  if(startDistance<=0||distance<=0)return startZoom;
  return Math.max(.65,Math.min(1.65,startZoom*startDistance/distance));
}
// Rounded return around each cover edge; the whole bend stays outside the cover.
export function bandProfile(t,height,bottom,top){
  const edge=1/12,half=height/2,mid=(top+bottom)/2,r=(top-bottom)/2;
  if(t<edge){const a=-Math.PI/2+t/edge*Math.PI;return [half+.045*Math.cos(a),mid+r*Math.sin(a)];}
  if(t>1-edge){const a=Math.PI/2-(t-(1-edge))/edge*Math.PI;return [-half-.045*Math.cos(a),mid+r*Math.sin(a)];}
  return [half-(t-edge)/(1-2*edge)*height,top];
}
