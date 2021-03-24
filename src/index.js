import domready from "domready"
// noinspection ES6UnusedImports
import STYLE from "./style.css"
import loadImage from "./loadImage";
import SimplexNoise from "simplex-noise";

const noise = new SimplexNoise();

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0,
    sourceData: 0
};

let ctx, canvas, sourceCtx;

const scale = 1

const brushSize = 5;

let toLinear = 2.2;
let fromLinear = 1/toLinear;

function getSpiralSize(centerX, centerY)
{

    const { width, height } = config;

    const midX = width/2;
    const midY = height/2;

    // distance to the corner opposite to the quadrant we're in.
    let refX, refY;
    if (centerX < midX)
    {
        refX = width;
    }
    else
    {
        refX = 0;
    }

    if (centerY < midY)
    {
        refY = height;
    }
    else
    {
        refY = 0;
    }

    const dx = refX - centerX;
    const dy = refY - centerY;

    return Math.sqrt(dx * dx + dy * dy) + brushSize;
}

function MinMax()
{
    this.min = Infinity;
    this.max = -Infinity;

}

MinMax.prototype.expand = function(n) {
    this.min = Math.min(this.min, n);
    this.max = Math.max(this.max, n);
}

// MinMax.prototype.toString = function () {
//     return "[" + this.min + ", " + this.max + "]";
// }


function drawSpiral(fn)
{
    const { width, height } = config;

    const centerX = width / 2 - 90;
    const centerY = height / 2 - 60;

    const step = brushSize * 0.5;
    const diff = brushSize * 2;


    ctx.fillStyle = "#000";

    const size = getSpiralSize(centerX, centerY);


    const m = new MinMax();

    const noiseScale = 0.004;
    const noiseMagnitude= 6;

    for (let radius = size; radius >= 0; radius -= diff)
    {
        const count = (TAU * radius / step)|0;

        const aDelta = TAU / count;
        const dDelta = diff / count;

        let a = 0;
        let d = radius;
        for (let i=0; i < count; i++)
        {

            let x = Math.round(centerX + Math.cos(a) * d);
            const y = Math.round(centerY + Math.sin(a) * d);


            x += noise.noise2D(x * noiseScale , y * noiseScale) * noiseMagnitude;

            const brush = fn(x,y)

            if (brush > 0)
            {
                ctx.beginPath();
                ctx.arc( x, y, brush, 0, TAU, false);
                ctx.fill();
            }

            d -= dDelta;
            a += aDelta;
        }
    }

}


domready(() => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");


        loadImage("media/photo-5128346.jpg").then(
        //loadImage("media/redditgetsdrawn-fallout42-2.jpg").then(
            image => {
                    let { width, height } = image;

                    width *= scale;
                    height *= scale;

                    config.width = width;
                    config.height = height;

                    canvas.width = width;
                    canvas.height = height;

                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, width, height);

                    const source = document.createElement("canvas");
                    source.width = width;
                    source.height = height;

                    sourceCtx = source.getContext("2d");
                    sourceCtx.drawImage(image, 0, 0)

                    config.sourceData = sourceCtx.getImageData(0,0,width, height);


                    // // naive center pick
                    // drawSpiral((x,y) => {
                    //
                    //     const { width, height, sourceData : { data } } = config;
                    //
                    //     const dataLineSize = width << 2;
                    //
                    //     if (x < 0 || y < 0 || x >= width || y >= height)
                    //     {
                    //         return 0;
                    //     }
                    //     else
                    //     {
                    //         const value = data[y * dataLineSize + (x << 2)];
                    //         return Math.pow(1 - value/255, 1.15) * brushSize;
                    //     }
                    // })

                    const white = Math.pow(255,toLinear)

                    drawSpiral((cx,cy) => {

                        const { width, height, sourceData : { data } } = config;

                        const dataLineSize = width << 2;
                        const radius = (brushSize * 1.618)|0;
                        const rSquared = radius * radius;

                        let valueSum = 0;
                        let count = 0;

                        cx |= 0;
                        cy |= 0;

                        for (let y = -radius; y < radius; y++)
                        {
                            const span = Math.round(Math.sqrt(rSquared - y * y));

                            for (let x = -span; x < span; x++)
                            {
                                const currX = cx + x;
                                const currY = cy + y;

                                if (currX < 0 || currY < 0 || currX >= width || currY >= height)
                                {
                                    valueSum += white;
                                }
                                else
                                {
                                    valueSum += Math.pow(data[currY * dataLineSize + (currX << 2)], 2.23)

                                    if (isNaN(valueSum))
                                    {
                                        debugger;
                                    }
                                }
                                count++;
                            }
                        }

                        let result = Math.pow(valueSum / count, fromLinear);

                        //console.log(valueSum, count, result);


                        return (1 - result/255) * radius;
                    })


            }
        )

});
