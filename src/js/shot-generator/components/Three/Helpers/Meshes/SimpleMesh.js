import Mesh from './Mesh'
class SimpleMesh extends Mesh {

    constructor(drawingCtx) {
        super(drawingCtx);
       // this.drawingCtx.lineJoin = true;
    }

    draw(currentPos, mesh) {
        super.draw(currentPos, mesh);
        this.drawingCtx.strokeStyle = mesh.color;
        this.drawingCtx.fillStyle = mesh.color;
        this.drawingCtx.lineWidth = this.brushSize;

        let circle = new Path2D();
        let xOffset = currentPos.x - this.prevPos.x;
        let yOffset = currentPos.y - this.prevPos.y;
        let length
        if(Math.abs(xOffset) < Math.abs(yOffset)) {
            length = Math.abs(yOffset)
          
        } else  {
            length = Math.abs(xOffset)
        }
        xOffset /= length;
        yOffset /= length;
        let size = this.brushSize
        for(let i = 0; i < length; i++) {
            let x = xOffset * i;
            let y = yOffset * i;
            circle.moveTo(this.prevPos.x + x, this.prevPos.y + y);
            circle.arc(this.prevPos.x + x, this.prevPos.y + y, size, 0, 2 * Math.PI)    
        }
        this.drawingCtx.stroke();
        this.drawingCtx.fill(circle)
        this.prevPos.x = currentPos.x;
        this.prevPos.y = currentPos.y;
    }
}

export default SimpleMesh