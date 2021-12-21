// import { HelloWorldInTypescript } 
//     from './hello-world-in-typescript.class';
// HelloWorldInTypescript.HelloWorld();

import { BufferGeometry, LineBasicMaterial, AdditiveBlending, PointsMaterial, Scene, Color, OrthographicCamera, Vector3, WebGLRenderer, Float32BufferAttribute, LineSegments, Points, Event, Object3D, Camera } from "three";

let scene: Scene;
let camera: Object3D<Event> | OrthographicCamera;
let renderer: WebGLRenderer;

let xC1=0;
let xC2=110;
let capxC1=xC1;
let capxC2=xC2;

let State="Idle";

let rotX=0,rotY=0;

let floor=0,ceil=110/130;

var lineMesh: LineSegments<BufferGeometry, LineBasicMaterial>;

var geometryLine = new BufferGeometry();

var pointGeometry = new BufferGeometry();
var pointGeometry_glide = new BufferGeometry();

var initPointGeometry = new BufferGeometry();

var material = new LineBasicMaterial({
    transparent: true,
    opacity:0.3,
    vertexColors: true,
    blending: AdditiveBlending
});

var pointMaterial = new PointsMaterial({
    size:3,
    vertexColors:true,
    transparent:true,
    opacity:0.5,
    blending:AdditiveBlending
});

var indices: any[] = [];
var colors_grad: number[] = [];
var colors_glide: number[] = [];
var positions: number[] = [];

var positionsPoint =[];

var HmeanList: any[] = [];

var particulesMesh: Points<BufferGeometry, PointsMaterial>;

var mode ="grad mode";

var container: HTMLDivElement;

function init() {

    // Create Scene
    scene = new Scene();
    scene.background = new Color( 0x000000 );

    // Create Camera
    let aspectRatio = window.innerWidth / window.innerHeight;
    camera = new OrthographicCamera( -0.7 * aspectRatio, 0.7 * aspectRatio, 0.7, -0.7, 0.00001, 1000 );
    scene.add( camera );
    camera.position.set( 0, 0, 1 );
    camera.lookAt( new Vector3( 0, 0, 0 ) );

    // Create renderer
    renderer = new WebGLRenderer( {
        antialias: true
    } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    container.appendChild( renderer.domElement );
    
    // Add mode change listener
    var checkbox = <HTMLInputElement>document.getElementById("checkbox");
    checkbox.onchange=(()=>{mode=mode=="grad mode"?"VS mode":"grad mode";console.log("mode changed : "+mode);onSwitchToggled()});

    // Animation loop
    animate();

    // Resize event
    window.addEventListener( 'resize', onWindowResize );
    
    //loadTxt();
    //exampleThreejs();
    load3DVisual();

    container.addEventListener( 'wheel', (event) => {
      
        let zoom = (<OrthographicCamera>camera).zoom; // take current zoom value
        zoom += event.deltaY * -0.01; /// adjust it
        zoom = Math.max(.0125, zoom); /// clamp the value
      
       (<OrthographicCamera>camera).zoom = zoom ;/// assign new zoom value
       (<OrthographicCamera>camera).updateProjectionMatrix(); /// ma
        //camera.position.add(new Vector3(0,0,event.deltaY/500));// .needsUpdate = true;

        camera.translateOnAxis(new Vector3(0,0,-1),event.deltaY/250);
        (<OrthographicCamera>camera).updateProjectionMatrix(); /// ma


    });

    var sliderx =  <HTMLDivElement>document.getElementById("slider-x");
    var slidery =  <HTMLDivElement>document.getElementById("slider-y");
    sliderx.oninput = onSliderXInput;
    slidery.oninput = onSliderYInput;
      
    initSlider();

    initPan();
}

function initSlider(){
    var canvas =<HTMLCanvasElement> document.getElementById("range-slider");
    var valmin = <HTMLDivElement>document.getElementById("valmin");
    var valmax =  <HTMLDivElement>document.getElementById("valmax");
    
    canvas.addEventListener('mousedown',sliderMouseDown);
    document.addEventListener('mouseup',(ev)=>{xC1=capxC1;xC2=capxC2;State="Idle"});
    document.addEventListener('mousemove',sliderMove);
    var ctx=<CanvasRenderingContext2D>canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0,5,canvas.width,canvas.height-10);
    ctx.stroke();
    ctx.fillStyle = "green";
    ctx.fillRect(xC1,5,xC2+10,10);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(xC1,0,10,20);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(xC2,0,10,20);
    ctx.stroke();
    valmin.innerHTML=Math.round(xC1*(MMax.zmax-MMax.zmin)/130+MMax.zmin).toString();
    valmax.innerHTML=Math.round((xC2-10)*(MMax.zmax-MMax.zmin)/130+MMax.zmin).toString();
}

function onSliderXInput(this: any){
    //rotX=this.value*Math.PI/180;
    lineMesh.rotateX(this.value*Math.PI/180-rotX);
    particulesMesh.rotateX(this.value*Math.PI/180-rotX);
    rotX = this.value*Math.PI/180;
}

function onSliderYInput(this: any){
    lineMesh.rotateY(this.value*Math.PI/180-rotY);
    particulesMesh.rotateY(this.value*Math.PI/180-rotY);

    rotY = this.value*Math.PI/180;

}

function initPan(){
    container.addEventListener('mousedown',panMouseDown);
    container.addEventListener('mouseup',panMouseUp);
    container.addEventListener('mousemove',panMouseMove);
}

function panMouseDown(ev: { buttons: number; }){
    if(ev.buttons>0){

        State="Panning";
        console.log("start panning");
    }

}

function panMouseMove(ev: { buttons: number; movementX: number; movementY: number; }){
    
    console.log(ev.buttons);
    if(ev.buttons==4 && State=="Panning"){
        //camera.rotateOnAxis(new Vector3(1,0,0),ev.movementY/5*Math.PI/180);
        //camera.rotateOnAxis(new Vector3(0,1,0),ev.movementX/5*Math.PI/180);
        
        camera.translateOnAxis(new Vector3(0,1,0),ev.movementY/250);
        camera.translateOnAxis(new Vector3(-1,0,0),ev.movementX/250);
        
        (<OrthographicCamera>camera).updateProjectionMatrix();

        // lineMesh.rotateY(ev.movementX/5*Math.PI/180);
        // particulesMesh.rotateY(ev.movementX/5*Math.PI/180);

        // lineMesh.rotateX(ev.movementY/5*Math.PI/180);
        // particulesMesh.rotateX(ev.movementY/5*Math.PI/180);
    }
    else if(ev.buttons==1 && State=="Panning"){
        camera.translateOnAxis(new Vector3(0,1,0),ev.movementY/250);
        camera.translateOnAxis(new Vector3(-1,0,0),ev.movementX/250);
        camera.lookAt(0,0,0);
        (<OrthographicCamera>camera).updateProjectionMatrix(); /// ma

    }

}

function panMouseUp(ev: any){
    if(State=="Panning"){
        State="Idle";
    }

}

function onSwitchToggled(){
    let positionArray = particulesMesh.geometry.attributes.color;
    let LineArray = lineMesh.geometry.attributes.color;

    if(mode=="grad mode"){
        for (let index = 0; index < positionArray.count; index++) {
            positionArray.setXYZ(index,colors_grad[3*index],colors_grad[3*index+1],colors_grad[3*index+2]);
            LineArray.setXYZ(index, colors_grad[3 * index], colors_grad[3 * index + 1], colors_grad[3 * index + 2]);
          //  (particulesMesh.geometry.attributes.position.array)[index] = initPositionArray[index];  
        }
    }
    else {       
        for (let index = 0; index < positionArray.count; index++) {
            positionArray.setXYZ(index,colors_glide[3*index],colors_glide[3*index+1],colors_glide[3*index+2]);
            LineArray.setXYZ(index, colors_glide[3 * index], colors_glide[3 * index + 1], colors_glide[3 * index + 2]);
            //  (particulesMesh.geometry.attributes.position.array)[index] = initPositionArray[index];  
        }      
    }
    particulesMesh.geometry.attributes.color.needsUpdate = true;
    lineMesh.geometry.attributes.color.needsUpdate = true;

}

function onWindowResize() {

    //camera.aspect = window.innerWidth / window.innerHeight;
    //camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}

function sliderMouseDown(ev: any): void{

    if(ev.layerX>=xC1 && ev.layerX<=xC1+10){
        State = "C1"

    }
    else if (ev.layerX>=xC2 && ev.layerX<=xC2+10){
        State = "C2"
    }
    
}

function sliderMove(ev: { movementX: number; }){

    switch (State) {
        case "C1":
            //xC1 = Math.min(Math.max(xC1 + ev.movementX/1.25,0),xC2-10);
            xC1 = xC1 + ev.movementX;
            capxC1 =  capXC1Cursor(xC1,capxC2);
            break;
        case "C2":
            //xC2 = Math.max(Math.min(xC2 + ev.movementX/1.25,150-10),xC1+10);
            xC2 = xC2 + ev.movementX;
            capxC2 =  capXC2Cursor(capxC1,xC2);
            break;
        default:
            return;
            break;
    }
    var canvas = <HTMLCanvasElement>document.getElementById("range-slider");
    var valmin = <HTMLDivElement>document.getElementById("valmin");
    var valmax = <HTMLDivElement>document.getElementById("valmax");
     
    floor = xC1/130;
    ceil = (xC2-10)/130;
    
    var ctx=<CanvasRenderingContext2D>canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0,5,canvas.width,canvas.height-10);
    ctx.stroke();
    

    ctx.fillStyle = "green";
    ctx.fillRect(capxC1,5,capxC2+10-capxC1,10);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(capxC1,0,10,20);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(capxC2,0,10,20);

    ctx.stroke();
    valmin.innerHTML=Math.round(capxC1*(MMax.zmax-MMax.zmin)/130+MMax.zmin).toString();
    valmax.innerHTML=Math.round((capxC2-10)*(MMax.zmax-MMax.zmin)/130+MMax.zmin).toString();
    filterListV2();

}

function capXC1Cursor(x: number,y: number){
    return Math.min(Math.max(x,0),y-10);
}
function capXC2Cursor(x: number,y: number){
    return Math.max(Math.min(y,150-10),x+10);
}

var time=0;
/**
 * Boucle de rendu qui s'exécutera chaque frame
 */

function animate() {

    requestAnimationFrame( animate );
    time++;
    if(time%2==0){
        const positionArray = particulesMesh.geometry.attributes.position;
        const initpositionArray = initPointGeometry.attributes.position;
        if(time%100 == 0){
            for (let index = 0; index < positionArray.count; index++) {
                positionArray.setXYZ(index, initpositionArray.getX(index),initpositionArray.getY(index),initpositionArray.getZ(index));
              //  (particulesMesh.geometry.attributes.position.array)[index] = initPositionArray[index];  
            }
        }
        else {
            for (let index = 0; index < positionArray.count; index++) {
                positionArray.setXYZ(index, positionArray.getX(index)+vectorList[3*index]/50,positionArray.getY(index)+vectorList[3*index+1]/50,positionArray.getZ(index)+vectorList[3*index+2]/50);
//                positionArray[index]+=vectorList[index]/50;   
            }
        }
        
        
        particulesMesh.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render( scene,<Camera>camera );

};

function loadFRMap() {

    // 
    var myDataStr = (<HTMLDivElement>(document.getElementById("FRCoord"))).innerText;
    var mdstr3 = myDataStr.split('\n');
    //myDataStr = myDataStr.split( '\n' );
    var cb: string[][] = [];
    //console.log(mdstr2);
    mdstr3.forEach(element => {

        cb.push(element.split(';'));
    });
   

    
    //console.log(cb);
    return cb;

}


/**
 * Récupérer les informations des trajectoires
 */
function loadTxt() {

    // 
    var myDataStr = (<HTMLDivElement>(document.getElementById("myData"))).innerText;
    var mdstr2 = myDataStr.split( '\n');
    //myDataStr = myDataStr.split( '\n' );
    var cb: string[][] = [];
    mdstr2.shift();
    //console.log(mdstr2);
    mdstr2.forEach(element => {

        cb.push(element.split(';'));
    });
   

    
    //console.log(cb);
    return cb;

}


function getmax(res: any[]){
    
    let xmax=-Infinity, xmin=Infinity,ymax=-Infinity, ymin=Infinity,zmax=-Infinity, zmin=Infinity;
    res.forEach((v: string[])=>{
        xmax = Math.max(parseFloat(v[2]),xmax);
        ymax = Math.max(parseFloat(v[3]),ymax);
        zmax = Math.max(parseFloat(v[4]),zmax);
        xmin = Math.min(parseFloat(v[2]),xmin);
        ymin = Math.min(parseFloat(v[3]),ymin);
        zmin = Math.min(parseFloat(v[4]),zmin);
    });
    return {xmax:xmax,xmin:xmin,ymax:ymax,ymin:ymin,zmax:zmax,zmin:zmin};
}

function exampleThreejs(){
    var geometryLine = new BufferGeometry();
    var material = new LineBasicMaterial({
        transparent: true,
        opacity:0.8,
        vertexColors: true,
        blending: AdditiveBlending
    });

    var indices = [];
    var colors = [];
    var positions = [];
    positions.push(-0.5,-0.5,-0.5);
    positions.push(0.5,0.5,0.5);
    colors.push(1,1,0);
    colors.push(0,1,0);
    indices.push(0,1);

    geometryLine.setAttribute('position',new Float32BufferAttribute(positions,3));
    geometryLine.setAttribute('color',new Float32BufferAttribute(colors,3));
    geometryLine.setIndex(indices);

    var lineMesh = new LineSegments(geometryLine, material);
    scene.add(lineMesh);

}

var MMax: { zmax: any; zmin: any; xmin: any; xmax: any; ymin: any; ymax: any; };

var vectorList:number[] =[];

var dico:any = {};

function load3DVisual(){
    var values = loadTxt();
    MMax = getmax(values);

    

    dico = {};
    values.forEach(val => {
        let ind = parseInt(val[0]);
        if (Object.keys(dico).includes(ind.toString())) {
            dico[ind.toString()].push(val);  
        }
        else {
            dico[ind.toString()] = [];
            dico[ind.toString()].push(val);
        }
    });
    //var lonely= {key:dico["2"]};
    let k=0;
    
    Object.values(dico).forEach(val=>{
       
        
        let hmean = 0;
        let first = (<Array<any>>val).shift();
        positions.push(-(parseFloat(first[2])-MMax.xmin)/(MMax.xmax-MMax.xmin)+1/2,(parseFloat(first[3])-MMax.ymin)/(MMax.ymax-MMax.ymin)-1/2,(parseFloat(first[4])-MMax.zmin)/(MMax.zmax-MMax.zmin)-1/2);
        colors_grad.push(0*colorRatio((parseFloat(first[4])-MMax.zmin)/(MMax.zmax-MMax.zmin),0),colorRatio((parseFloat(first[4])-MMax.zmin)/(MMax.zmax-MMax.zmin),0.0),colorRatio((parseFloat(first[4])-MMax.zmin)/(MMax.zmax-MMax.zmin),1));
        colors_glide.push(0,0,0);
        hmean += parseFloat(first[4])/ (<Array<any>>val).length;
        k++;

        (<Array<any>>val).forEach((elt:string[])=>{
            positions.push(-(parseFloat(elt[2])-MMax.xmin)/(MMax.xmax-MMax.xmin)+1/2,(parseFloat(elt[3])-MMax.ymin)/(MMax.ymax-MMax.ymin)-1/2,(parseFloat(elt[4])-MMax.zmin)/(MMax.zmax-MMax.zmin)-1/2);
            indices.push(k-1,k);

            vectorList.push(positions[3*k]-positions[3*k-3],positions[3*k+1]-positions[3*k-2],positions[3*k+2]-positions[3*k-1]);
            if(mode=="grad mode"){
                 colors_grad.push(0*colorRatio((parseFloat(elt[4])-MMax.zmin)/(MMax.zmax-MMax.zmin),0),
            colorRatio((parseFloat(elt[4])-MMax.zmin)/(MMax.zmax-MMax.zmin),0.0),
            colorRatio((parseFloat(elt[4])-MMax.zmin)/(MMax.zmax-MMax.zmin),1));
            }
           
            if(positions[3*k+2]-positions[3*k-1]>=0.02){
                    colors_glide.push(0,0,1);
            }
            else if (positions[3*k+2]-positions[3*k-1]<=-0.02) {
                colors_glide.push(1,0,0);
            }
            else {
                colors_glide.push(0,1,0);
            }
               
            
           


            hmean += parseFloat(elt[4])/ (<number[]>val).length;
            k++;
        });
        vectorList.push(0,0,0);
        HmeanList.push(Math.round(hmean))
        
    })
    
    geometryLine.setAttribute('position',new Float32BufferAttribute(positions,3));
    geometryLine.setAttribute('color',new Float32BufferAttribute(colors_grad,3));

    pointGeometry.setAttribute('position',new Float32BufferAttribute(positions,3));
    pointGeometry.setAttribute('color',new Float32BufferAttribute(colors_grad,3));
    
    initPointGeometry.setAttribute('position',new Float32BufferAttribute([...positions],3));
    initPointGeometry.setAttribute('color',new Float32BufferAttribute(colors_grad,3));

    console.log(indices.length,HmeanList.length);


    filterListV2()
    lineMesh = new LineSegments(geometryLine, material);
    particulesMesh = new Points(pointGeometry, pointMaterial);
    console.log(pointGeometry);
    //lineMesh.geometry.set


    scene.add(lineMesh);
    scene.add(particulesMesh);

}

function filterList(){
    var indices_bis = [];
    let q = 0;
    indices_bis.push(indices[0],indices[1])
    for (let index = 2; index < indices.length; index+=2) {
        const el = indices[index];
        if (el==indices[index-1]){
            if ((HmeanList[q])>=floor && (HmeanList[q])<=ceil){
                indices_bis.push(el,indices[index+1]);
            }
        }
        else {
            q++;
        }     
    }

    geometryLine.setIndex(indices_bis);
}
var indices_bis,indices_bis_point;
function filterListV2(){
    indices_bis =[];
    indices_bis_point = [];
    let q = 0;
    indices_bis.push(indices[0],indices[1])
    for (let index = 2; index < indices.length; index+=2) {
        const el = indices[index];
            
            if (positions[2+3*el]>=(floor-0.5) && positions[2+3*el]<=(ceil-0.5)){
                indices_bis.push(el,indices[index+1]);
                indices_bis_point.push(el);

            }        
    }
    geometryLine.setIndex(indices_bis);
    pointGeometry.setIndex(indices_bis_point);
}

function colorRatio(val: number,base: number){
    return Math.max(0,1-Math.abs(val-base));
}
function part3(){
    var pointGeometry = new BufferGeometry();

    var positions = [];
    var colors =[];
    positions.push(0,0,0);
    colors.push(0,1,0);
    pointGeometry.setAttribute('position',new Float32BufferAttribute(positions,3));
    pointGeometry.setAttribute('color',new Float32BufferAttribute(colors,3));

    var pointMaterial = new PointsMaterial({
        size:20,
        vertexColors:true,
        transparent:true,
        opacity:0.5,
        blending:AdditiveBlending
    });

    particulesMesh = new Points(pointGeometry, pointMaterial);
    scene.add(particulesMesh);

}

function animate2(){
    requestAnimationFrame(animate);
    

    renderer.render(scene,<Camera>camera);
    
}
init();