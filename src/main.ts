import {
  BufferGeometry,
  LineBasicMaterial,
  AdditiveBlending,
  PointsMaterial,
  Scene,
  Color,
  OrthographicCamera,
  Vector3,
  WebGLRenderer,
  Float32BufferAttribute,
  LineSegments,
  Points,
  Camera,
} from "three";

let scene: Scene; //scène de la vue
let renderer: WebGLRenderer; //rendu de la vue
let container: HTMLDivElement; //conteneur pour la vue

var lineMesh: LineSegments<BufferGeometry, LineBasicMaterial>; //ensemble des segments des trajectoires de vol
var lineFRMesh: LineSegments<BufferGeometry, LineBasicMaterial>; //ensemble des segments des contours de la France 
var particulesMesh: Points<BufferGeometry, PointsMaterial>; //ensemble des points des trajectoires de vol
/**
 * liste contenant les paires d'indices de chaque point permettant de former les segments des trajectoires de vol
 */
var indices: number[] = [];
/**
 * liste contenant les indices de chaque point que compte les trajectoires de vol
 */
var positions: number[] = [];
/**
 * liste contenant pour chaque point que compte les trajectoires de vol le triplet de flottant qui définit sa couleur en mode gradient de niveau de vol  
 */
var colors_grad: number[] = [];
/**
 * liste contenant pour chaque point que compte les trajectoires de vol le triplet de flottant qui définit sa couleur en mode pente
 */
var colors_glide: number[] = [];

namespace Panel {
  /**
   * état de l'automate qui gère les évènements souris sur les sliders et sur la vue
   */
  export let State = "Idle";
  let xC1 = 0;
  let xC2 = 110;
  let capxC1 = xC1;
  let capxC2 = xC2;

  let GxC1 = 0;
  let GxC2 = 140;
  let GcapxC1 = GxC1;
  let GcapxC2 = GxC2;
  export let floor = 0,
    ceil = 110 / 130,
    glidefloor = 0,
    glideceil = 1;

  let rotX = 0,
    rotY = 0;
  /**
   * mode de visualisation des trajectoires de vol qui peut être de type "gradient associé au niveau de vol" ou "pente instantanée de la trajectoire"
   */
  var mode = "grad mode";
  /**
   * initialise le slider dédié au filtrage des niveaux de vol
   */
  export function initSlider() {
    var canvas = <HTMLCanvasElement>document.getElementById("range-slider");
    var valmin = <HTMLDivElement>document.getElementById("valmin");
    var valmax = <HTMLDivElement>document.getElementById("valmax");

    canvas.addEventListener("mousedown", sliderMouseDown);
    document.addEventListener("mouseup", (ev) => {
      xC1 = capxC1;
      xC2 = capxC2;
      State = "Idle";
    });
    document.addEventListener("mousemove", sliderMove);
    var ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 5, canvas.width, canvas.height - 10);
    ctx.stroke();
    ctx.fillStyle = "green";
    ctx.fillRect(xC1, 5, xC2 + 10, 10);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(xC1, 0, 10, 20);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(xC2, 0, 10, 20);
    ctx.stroke();
    valmin.innerHTML = Math.round(
      (xC1 * (load3DVue.MMax.zmax - load3DVue.MMax.zmin)) / 130 +
        load3DVue.MMax.zmin
    ).toString();
    valmax.innerHTML = Math.round(
      ((xC2 - 10) * (load3DVue.MMax.zmax - load3DVue.MMax.zmin)) / 130 +
        load3DVue.MMax.zmin
    ).toString();
  }
  /**
   * initialise le slider dédié au filtrage de la pente de montée/descente
   */
  export function initGlideSlider() {
    var Gcanvas = <HTMLCanvasElement>(
      document.getElementById("glide-range-slider")
    );
    var valmin = <HTMLDivElement>document.getElementById("glide-valmin");
    var valmax = <HTMLDivElement>document.getElementById("glide-valmax");

    Gcanvas.addEventListener("mousedown", glideSliderMouseDown);
    document.addEventListener("mouseup", (ev) => {
      GxC1 = GcapxC1;
      GxC2 = GcapxC2;
      State = "Idle";
    });
    document.addEventListener("mousemove", sliderMove);
    var ctx = <CanvasRenderingContext2D>Gcanvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 5, Gcanvas.width, Gcanvas.height - 10);
    ctx.stroke();
    ctx.fillStyle = "green";
    ctx.fillRect(GxC1, 5, GxC2 + 10, 10);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(GxC1, 0, 10, 20);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(GxC2, 0, 10, 20);
    ctx.stroke();
    valmin.innerHTML = Math.round(
      (GxC1 * (load3DVue.MMax.Dzmax - load3DVue.MMax.Dzmin)) / 130 +
        load3DVue.MMax.Dzmin
    ).toString();
    valmax.innerHTML = Math.round(
      ((GxC2 - 10) * (load3DVue.MMax.Dzmax - load3DVue.MMax.Dzmin)) / 130 +
        load3DVue.MMax.Dzmin
    ).toString();
  }
  /**
   * fonction appelée lorsqu'un bouton de la souris est enfoncé sur une des poignées du slider dédié au niveau de vol
   */
  function sliderMouseDown(ev: any): void {
    if (ev.layerX >= xC1 && ev.layerX <= xC1 + 10) {
      State = "C1";
    } else if (ev.layerX >= xC2 && ev.layerX <= xC2 + 10) {
      State = "C2";
    }
  }
  /**
   * fonction appelée lorsqu'un bouton de la souris est enfoncé sur une des poignées du slider dédié à la pente
   */
  function glideSliderMouseDown(ev: any): void {
    if (ev.layerX >= GxC1 && ev.layerX <= GxC1 + 10) {
      State = "GC1";
    } else if (ev.layerX >= GxC2 && ev.layerX <= GxC2 + 10) {
      State = "GC2";
    }
  }
  /**
   * fonction appelée lorsque la souris est déplacée après l'enfoncement d'une des poignées d'un des slider
   */
  function sliderMove(ev: { movementX: number }) {
    switch (State) {
      case "C1":
        xC1 = xC1 + ev.movementX;
        capxC1 = capXC1Cursor(xC1, capxC2);
        refreshSlider();
        break;
      case "C2":
        xC2 = xC2 + ev.movementX;
        capxC2 = capXC2Cursor(capxC1, xC2);
        refreshSlider();
        break;
      case "GC1":
        GxC1 = GxC1 + ev.movementX;
        GcapxC1 = capXC1Cursor(GxC1, GcapxC2);
        refreshGlideSlider();
        break;
      case "GC2":
        GxC2 = GxC2 + ev.movementX;
        GcapxC2 = capXC2Cursor(GcapxC1, GxC2);
        refreshGlideSlider();
        break;
      default:
        return;
        break;
    }
  }
  /**
   * fonction qui rafraîchit la position des poignées du slider dédié au niveau de vol
   */
  function refreshSlider() {
    var canvas = <HTMLCanvasElement>document.getElementById("range-slider");
    var valmin = <HTMLDivElement>document.getElementById("valmin");
    var valmax = <HTMLDivElement>document.getElementById("valmax");

    floor = xC1 / 130;
    ceil = (xC2 - 10) / 130;

    var ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 5, canvas.width, canvas.height - 10);
    ctx.stroke();

    ctx.fillStyle = "green";
    ctx.fillRect(capxC1, 5, capxC2 + 10 - capxC1, 10);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(capxC1, 0, 10, 20);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(capxC2, 0, 10, 20);

    ctx.stroke();
    valmin.innerHTML = Math.round(
      (capxC1 * (load3DVue.MMax.zmax - load3DVue.MMax.zmin)) / 130 +
        load3DVue.MMax.zmin
    ).toString();
    valmax.innerHTML = Math.round(
      ((capxC2 - 10) * (load3DVue.MMax.zmax - load3DVue.MMax.zmin)) / 130 +
        load3DVue.MMax.zmin
    ).toString();
    filterList();
  }
  /**
   * fonction qui rafraîchit la position des poignées du slider dédié à la pente
   */
  function refreshGlideSlider() {
    var Gcanvas = <HTMLCanvasElement>(
      document.getElementById("glide-range-slider")
    );
    var valmin = <HTMLDivElement>document.getElementById("glide-valmin");
    var valmax = <HTMLDivElement>document.getElementById("glide-valmax");

    glidefloor = GxC1 / 130;
    glideceil = (GxC2 - 10) / 130;

    var ctx = <CanvasRenderingContext2D>Gcanvas.getContext("2d");
    ctx.clearRect(0, 0, Gcanvas.width, Gcanvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 5, Gcanvas.width, Gcanvas.height - 10);
    ctx.stroke();

    ctx.fillStyle = "green";
    ctx.fillRect(GcapxC1, 5, GcapxC2 + 10 - GcapxC1, 10);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(GcapxC1, 0, 10, 20);
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fillRect(GcapxC2, 0, 10, 20);

    ctx.stroke();
    valmin.innerHTML = Math.round(
      (GcapxC1 * (load3DVue.MMax.Dzmax - load3DVue.MMax.Dzmin)) / 130 +
        load3DVue.MMax.Dzmin
    ).toString();
    valmax.innerHTML = Math.round(
      ((GcapxC2 - 10) * (load3DVue.MMax.Dzmax - load3DVue.MMax.Dzmin)) / 130 +
        load3DVue.MMax.Dzmin
    ).toString();
    filterList();
  }
  /**
   * fonction qui borne les valeurs obtenues via la poignée de gauche des sliders
   */
  function capXC1Cursor(x: number, y: number) {
    return Math.min(Math.max(x, 0), y - 10);
  }
  /**
   * fonction qui borne les valeurs obtenues via la poignée de droite des sliders
   */
  function capXC2Cursor(x: number, y: number) {
    return Math.max(Math.min(y, 150 - 10), x + 10);
  }
  /**
   * initialise le panneau de contrôle (sliders exceptés)
   */
  export function initPanel() {
    // Add mode change listener
    var checkbox = <HTMLInputElement>document.getElementById("checkbox");
    checkbox.onchange = () => {
      mode = mode == "grad mode" ? "VS mode" : "grad mode";
      console.log("mode changed : " + mode);
      onSwitchToggled();
    };
    var sliderx = <HTMLDivElement>document.getElementById("slider-x");
    var slidery = <HTMLDivElement>document.getElementById("slider-y");
    sliderx.oninput = onSliderXInput;
    slidery.oninput = onSliderYInput;
  }
  /**
   * fonction appelée quand le switch définissant le mode de visualisation (altitude ou pente) est enclenché
   */
  function onSwitchToggled() {
    let positionArray = particulesMesh.geometry.attributes.color;
    let LineArray = lineMesh.geometry.attributes.color;
    if (mode == "grad mode") {
      for (let index = 0; index < positionArray.count; index++) {
        positionArray.setXYZ(
          index,
          colors_grad[3 * index],
          colors_grad[3 * index + 1],
          colors_grad[3 * index + 2]
        );
        LineArray.setXYZ(
          index,
          colors_grad[3 * index],
          colors_grad[3 * index + 1],
          colors_grad[3 * index + 2]
        );
      }
    } else {
      for (let index = 0; index < positionArray.count; index++) {
        positionArray.setXYZ(
          index,
          colors_glide[3 * index],
          colors_glide[3 * index + 1],
          colors_glide[3 * index + 2]
        );
        LineArray.setXYZ(
          index,
          colors_glide[3 * index],
          colors_glide[3 * index + 1],
          colors_glide[3 * index + 2]
        );
      }
    }
    particulesMesh.geometry.attributes.color.needsUpdate = true;
    lineMesh.geometry.attributes.color.needsUpdate = true;
  }
  /**
   * fonction appelée quand le curseur slider de rotation selon l'axe X est déplacé  
   */
  function onSliderXInput(this: any) {
    lineMesh.rotateX((this.value * Math.PI) / 180 - rotX);
    lineFRMesh.rotateX((this.value * Math.PI) / 180 - rotX);
    particulesMesh.rotateX((this.value * Math.PI) / 180 - rotX);

    rotX = (this.value * Math.PI) / 180;
  }
  /**
   * fonction appelée quand le curseur slider de rotation selon l'axe Y est déplacé  
   */
  function onSliderYInput(this: any) {
    lineMesh.rotateY((this.value * Math.PI) / 180 - rotY);
    lineFRMesh.rotateY((this.value * Math.PI) / 180 - rotY);
    particulesMesh.rotateY((this.value * Math.PI) / 180 - rotY);

    rotY = (this.value * Math.PI) / 180;
  }
}

namespace Vue {
  export let camera: OrthographicCamera;
  /**
   * initialise la caméra utilisée dans la scène
   */
  export function initCamera() {
    // Create Camera
    let aspectRatio = window.innerWidth / window.innerHeight;
    camera = new OrthographicCamera(
      -0.7 * aspectRatio,
      0.7 * aspectRatio,
      0.7,
      -0.7,
      0.00001,
      1000
    );
    scene.add(camera);
    camera.position.set(0, 0, 1);
    camera.lookAt(new Vector3(0, 0, 0));
  }
  /**
   * abonne les mouvements de la caméra aux évenements souris permettant de réaliser des manipulations directes
   */
  export function initGestures() {
    container.addEventListener("wheel", (event) => {
      let zoom = (<OrthographicCamera>camera).zoom; // take current zoom value
      zoom *= Math.pow(1.005, -event.deltaY); /// adjust it
      zoom = Math.max(0.0125, zoom); /// clamp the value

      (<OrthographicCamera>camera).zoom = zoom; /// assign new zoom value
      (<OrthographicCamera>camera).updateProjectionMatrix(); /// maj

      camera.translateOnAxis(new Vector3(0, 0, -1), event.deltaY / 250);
      (<OrthographicCamera>camera).updateProjectionMatrix(); /// maj
    });

    container.addEventListener("mousedown", panMouseDown);
    container.addEventListener("mouseup", panMouseUp);
    container.addEventListener("mousemove", panMouseMove);
  }
  /**
   * fonction appelée quand l'utilisateur enfonce le bouton gauche ou la molette de sa souris sur la vue et qui enclenche l'état de pan
   */
  function panMouseDown(ev: { buttons: number }) {
    if (ev.buttons > 0) {
      Panel.State = "Panning";
    }
  }
  /**
   * fonction appelée quand l'utilisateur déplace sa souris alors que la vue est en état de pan
   * translate la caméra si le bouton de la molette est enfoncé
   * fait tourner la caméra autourdu centre de la figure si le bouton gauche de la souris est enfoncé 
   */
  function panMouseMove(ev: {
    buttons: number;
    movementX: number;
    movementY: number;
  }) {
    if (ev.buttons == 4 && Panel.State == "Panning") {
      camera.translateOnAxis(new Vector3(0, 1, 0), ev.movementY / 250);
      camera.translateOnAxis(new Vector3(-1, 0, 0), ev.movementX / 250);
      (<OrthographicCamera>camera).updateProjectionMatrix();
    } else if (ev.buttons == 1 && Panel.State == "Panning") {
      camera.translateOnAxis(new Vector3(0, 1, 0), ev.movementY / 250);
      camera.translateOnAxis(new Vector3(-1, 0, 0), ev.movementX / 250);
      camera.lookAt(0, 0, 0);
      (<OrthographicCamera>camera).updateProjectionMatrix(); /// ma
    }
  }
  /**
   * fonction appelée quand l'utilisateur relâche sa pression sur les boutons de la souris, permet de quitter l'état de pan
   */
  function panMouseUp(ev: any) {
    if (Panel.State == "Panning") {
      Panel.State = "Idle";
    }
  }
}

namespace load3DVue {
  /**
   * variable contenant les bornes des valeurs de positions de chaque point des trajectoires de vol étudiées
   */
  export var MMax: {
    zmax: number;
    zmin: number;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    Dzmax: number;
    Dzmin: number;
  };
  /**
   * liste contenant les triplets de coordonnées de chaque vecteur de déplacement associé à chaque trait des trajectoires de vol 
   */
  export var vectorList: number[] = [];

  var dico: any = {}; //dictionnaire utilisé pour extraire les trajectoires de vol de la balise HTML les contenant

  var frpositions: number[] = []; //liste des positions liées au contour de la france
  var frcolors: number[] = []; //liste des couleurs données au contour de la france
  var frindices: number[] = []; //liste des paires d'indices des positions liées au contour de la France permettant de former des segments
  /**
   * contient les segments des trajectoires de vol
   */
  export var geometryLine = new BufferGeometry(); 
  /**
   * contient les points des trajectoires de vol
   */
  export var pointGeometry = new BufferGeometry();
  /**
   * contient les points initiaux des trajectoires de vol (référence pour l'animation de déplacement des points le long de la trajectoire)
   */
  export var initPointGeometry = new BufferGeometry();

  var HmeanList: number[] = []; //liste contenant les valeurs moyennes d'altitude de chaque trajectoire
  /**
   * fonction principale permettant de générer la vue complète des trajectoires de vol
   */
  export function load3DVisual() {
    var values = loadTxt();
    MMax = getmax(values);
    displayFRMap();
    dico = {};
    values.forEach((val) => {
      let ind = parseInt(val[0]);
      if (Object.keys(dico).includes(ind.toString())) {
        dico[ind.toString()].push(val);
      } else {
        dico[ind.toString()] = [];
        dico[ind.toString()].push(val);
      }
    });
    let k = 0;

    Object.values(dico).forEach((val) => {
      let hmean = 0;
      let first = (<Array<any>>val).shift();
      positions.push(
        (parseFloat(first[2]) - MMax.xmin) / (MMax.xmax - MMax.xmin) - 1 / 2,
        (parseFloat(first[3]) - MMax.ymin) / (MMax.ymax - MMax.ymin) - 1 / 2,
        (parseFloat(first[4]) - MMax.zmin) / (MMax.zmax - MMax.zmin) - 1 / 2
      );
      colors_grad.push(
        0,
        colorRatio(
          (parseFloat(first[4]) - MMax.zmin) / (MMax.zmax - MMax.zmin),
          0.0
        ),
        0.5 +
          0.5 *
            colorRatio(
              (parseFloat(first[4]) - MMax.zmin) / (MMax.zmax - MMax.zmin),
              1
            )
      );
      colors_glide.push(0, 0, 0);
      hmean += parseFloat(first[4]) / (<Array<any>>val).length;
      k++;

      (<Array<any>>val).forEach((elt: string[]) => {
        positions.push(
          (parseFloat(elt[2]) - MMax.xmin) / (MMax.xmax - MMax.xmin) - 1 / 2,
          (parseFloat(elt[3]) - MMax.ymin) / (MMax.ymax - MMax.ymin) - 1 / 2,
          (parseFloat(elt[4]) - MMax.zmin) / (MMax.zmax - MMax.zmin) - 1 / 2
        );
        indices.push(k - 1, k);

        vectorList.push(
          positions[3 * k] - positions[3 * k - 3],
          positions[3 * k + 1] - positions[3 * k - 2],
          positions[3 * k + 2] - positions[3 * k - 1]
        );

        colors_grad.push(
          0,
          colorRatio(
            (parseFloat(elt[4]) - MMax.zmin) / (MMax.zmax - MMax.zmin),
            0.0
          ),
          0.5 +
            0.5 *
              colorRatio(
                (parseFloat(elt[4]) - MMax.zmin) / (MMax.zmax - MMax.zmin),
                1
              )
        );

        if (positions[3 * k + 2] - positions[3 * k - 1] >= 0.02) {
          colors_glide.push(0, 0, 1);
        } else if (positions[3 * k + 2] - positions[3 * k - 1] <= -0.02) {
          colors_glide.push(1, 0, 0);
        } else {
          colors_glide.push(0, 1, 0);
        }

        hmean += parseFloat(elt[4]) / (<number[]>val).length;
        k++;
      });
      vectorList.push(0, 0, 0);
      HmeanList.push(Math.round(hmean));
    });
    let M: number = vectorList.reduce(function (a, b) {
      return Math.max(a, b);
    });
    let m: number = vectorList.reduce(function (a, b) {
      return Math.min(a, b);
    });
    MMax.Dzmax = M * (MMax.zmax - MMax.zmin);
    MMax.Dzmin = m * (MMax.zmax - MMax.zmin);

    geometryLine.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    );
    geometryLine.setAttribute(
      "color",
      new Float32BufferAttribute(colors_grad, 3)
    );

    pointGeometry.setAttribute(
      "position",
      new Float32BufferAttribute(positions, 3)
    );
    pointGeometry.setAttribute(
      "color",
      new Float32BufferAttribute(colors_grad, 3)
    );

    initPointGeometry.setAttribute(
      "position",
      new Float32BufferAttribute([...positions], 3)
    );
    initPointGeometry.setAttribute(
      "color",
      new Float32BufferAttribute(colors_grad, 3)
    );

    filterList();
    var material = new LineBasicMaterial({
      transparent: true,
      opacity: 0.3,
      vertexColors: true,
      blending: AdditiveBlending,
    });
    var pointMaterial = new PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
    });
    lineMesh = new LineSegments(geometryLine, material);
    particulesMesh = new Points(pointGeometry, pointMaterial);

    scene.add(lineMesh);
    scene.add(particulesMesh);
  }

  /**
   * Récupère les informations des trajectoires de vol
   */
  function loadTxt() {
    let myDataStr = (<HTMLDivElement>document.getElementById("myData"))
      .innerText;
    let mdstr2 = myDataStr.split("\n");
    var cb: string[][] = [];
    mdstr2.shift();
    mdstr2.forEach((element) => {
      cb.push(element.split(";"));
    });
    return cb;
  }
  /**
   * permet d'obtenir les bornes d'une liste de trajectoires
   * @params liste de trajectoires 
   * @returns objet comportant les min et les max de chaque axe
   */
  function getmax(res: any[]): {xmax:number,xmin:number,ymax:number,ymin:number,zmax:number,zmin:number,Dzmax:number,Dzmin:number} {
    let xmax = -Infinity,
      xmin = Infinity,
      ymax = -Infinity,
      ymin = Infinity,
      zmax = -Infinity,
      zmin = Infinity,
      Dzmax = -Infinity,
      Dzmin = Infinity;

    res.forEach((v: string[]) => {
      xmax = Math.max(parseFloat(v[2]), xmax);
      ymax = Math.max(parseFloat(v[3]), ymax);
      zmax = Math.max(parseFloat(v[4]), zmax);
      xmin = Math.min(parseFloat(v[2]), xmin);
      ymin = Math.min(parseFloat(v[3]), ymin);
      zmin = Math.min(parseFloat(v[4]), zmin);
    });

    return {
      xmax: xmax,
      xmin: xmin,
      ymax: ymax,
      ymin: ymin,
      zmax: zmax,
      zmin: zmin,
      Dzmax: Dzmax,
      Dzmin: Dzmin,
    };
  }
  /**
   * affiche les contours de la France dans la vue
   */
  function displayFRMap() {
    var FRborder = loadFRMap();
    let l: number = 0;
    FRborder.forEach((val) => {
      frpositions.push(
        (parseFloat(val[0]) - MMax.xmin) / (MMax.xmax - MMax.xmin) - 1 / 2
      );
      frpositions.push(
        (parseFloat(val[1]) - MMax.ymin) / (MMax.ymax - MMax.ymin) - 1 / 2
      );
      frpositions.push(-1 / 2);
      frcolors.push(1, 1, 1);
      frindices.push(l, l + 1);
      l++;
    });
    frindices.pop();
    frindices.pop();
    var FRgeometryLine = new BufferGeometry();
    FRgeometryLine.setAttribute(
      "position",
      new Float32BufferAttribute(frpositions, 3)
    );
    FRgeometryLine.setAttribute(
      "color",
      new Float32BufferAttribute(frcolors, 3)
    );
    FRgeometryLine.setIndex(frindices);
    var FRmaterial = new LineBasicMaterial({
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: AdditiveBlending,
    });
    lineFRMesh = new LineSegments(FRgeometryLine, FRmaterial);
    scene.add(lineFRMesh);
  }
  /**
   * charge les coordonnées des contours de la France depuis la balise HTML les contenant
   */
  function loadFRMap() {
    let myDataStr = (<HTMLDivElement>document.getElementById("FRCoord"))
      .innerText;
    let mdstr3 = myDataStr.split("\n");
    var cb: string[][] = [];
    mdstr3.forEach((element) => {
      cb.push(element.split(";"));
    });
    return cb;
  }
  /**
   * fonction qui permet de générer un gradient de couleur homogène
   * @param val position entre 0 et 1 de la valeur entrante 
   * @param base position de référence comprise entre 0 et 1
   */
  function colorRatio(val: number, base: number) {
    return Math.max(0, 1 - Math.abs(val - base));
  }
}
/**
 * fonction principale d'initilisation de la page
 */
function init() {
  // Create Scene
  scene = new Scene();
  scene.background = new Color(0x000000);

  // Create renderer
  renderer = new WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container = document.createElement("div");
  document.body.appendChild(container);
  container.appendChild(renderer.domElement);

  Vue.initCamera();
  Vue.initGestures();

  // Animation loop
  animate();

  // Resize event
  window.addEventListener("resize", () =>
    renderer.setSize(window.innerWidth, window.innerHeight)
  );

  Panel.initPanel();
  load3DVue.load3DVisual();
  Panel.initSlider();
  Panel.initGlideSlider();
}

/**
 * Boucle de rendu qui s'exécutera chaque frame
 */
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time++;
  if (time % 2 == 0) {
    const positionArray = particulesMesh.geometry.attributes.position;
    const initpositionArray = load3DVue.initPointGeometry.attributes.position;
    if (time % 100 == 0) {
      for (let index = 0; index < positionArray.count; index++) {
        positionArray.setXYZ(
          index,
          initpositionArray.getX(index),
          initpositionArray.getY(index),
          initpositionArray.getZ(index)
        );
      }
    } else {
      for (let index = 0; index < positionArray.count; index++) {
        positionArray.setXYZ(
          index,
          positionArray.getX(index) + load3DVue.vectorList[3 * index] / 50,
          positionArray.getY(index) + load3DVue.vectorList[3 * index + 1] / 50,
          positionArray.getZ(index) + load3DVue.vectorList[3 * index + 2] / 50
        );
      }
    }
    particulesMesh.geometry.attributes.position.needsUpdate = true;
  }
  renderer.render(scene, <Camera>Vue.camera);
}

var indices_bis, indices_bis_point;
/**
 * fonction de filtrage permettant de retirer les fragments de trajectoires ne se trouvant pas entre les bornes définies par les sliders
 */
function filterList() {
  indices_bis = [];
  indices_bis_point = [];
  // indices_bis.push(indices[0], indices[1]);
  for (let index = 0; index < indices.length; index += 2) {
    const el = indices[index];

    if (
      positions[2 + 3 * el] >= Panel.floor - 0.5 &&
      positions[2 + 3 * el] <= Panel.ceil - 0.5 &&
      load3DVue.vectorList[2 + 3 * el] >= 2 * (Panel.glidefloor - 0.5) &&
      load3DVue.vectorList[2 + 3 * el] <= 2 * (Panel.glideceil - 0.5)
    ) {
      indices_bis.push(el, indices[index + 1]);
      indices_bis_point.push(el);
    }
  }
  load3DVue.geometryLine.setIndex(indices_bis);
  load3DVue.pointGeometry.setIndex(indices_bis_point);
}

init();
