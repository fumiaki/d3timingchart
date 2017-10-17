// サンプルデータ
var dataSet = [
  {x:0, y:5},
	{x:1, y:26},
	{x:2, y:10},
	{x:3, y:56},
	{x:4, y:46},
	{x:5, y:87},
];

// SVGの描画サイズとマージン
var margin = {top : 20, right : 40, bottom : 100, left : 100};
var width = 800 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

// SVGの表示領域を生成
var svg = d3.select("#chart")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//x軸のスケールを作成
var xScale = d3.scaleLinear()
  .domain([0, d3.max(dataSet, function(d){return d.x})])
  .range([0, width])
  .nice();

//y軸のスケールを作成
var yScale = d3.scaleLinear()
	.domain([0, d3.max(dataSet, function(d){ return d.y + 5; })])
	.range([height, 0])
  .nice();

//x,y軸の作成
var xAxis = d3.axisBottom(xScale);
var yAxis = d3.axisLeft(yScale);

//x,yの値からスケール後のlineを描画するための関数
var line = d3.line()
	.x(function(d) {return xScale(d.x);})
	.y(function(d) {return yScale(d.y);})
	.curve(d3.curveLinear);

// x軸を描画
svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

// y軸を描画
svg.append("g")
	.attr("class", "y axis")
	.call(yAxis);

// path要素として折れ線グラフを描画
svg.append("path")
	.datum(dataSet)
	.attr("class", "line")
	.attr("d", line(dataSet));
