let columnas = 24;
let filas = 24;
let tamanoCelda;
let tamanoLienzo;

let mic;
let fft; 
let micIniciado = false;
let ultimoAplauso = 0;
let obraActual = 0; 

// Variables globales de audio
let factorFrecuencia = 1.0;
let energiaGrave = 0;
let energiaAguda = 0;

// --- VARIABLES OBRA 1 ---
let avanceColor1 = 0;
let coloresLeParc1 = [
  '#E30613', '#EA5514', '#F39200', '#FFF200', '#A0C814',
  '#009B4E', '#008984', '#007FA4', '#005CA9', '#2E3192',
  '#662D91', '#92278F', '#D71463', '#E5006D'
];
let coloresFondo1 = [
  '#2E3A4B', '#455568', '#637387', '#7C8C9F',
  '#37475E', '#1A2533', '#526175', '#8A99AB'
];

// --- VARIABLES OBRA 2 ---
let avanceColor2 = 0;
let coloresLeParc2 = [
  '#E63946', '#D62828', '#F4A261', '#FFD166', '#E9C46A',
  '#0d4aa1', '#457B9D', '#A8DADC', '#d39cd6', '#8338EC', '#B5179E',
  '#2A9D8F', '#07753a', '#52B788', '#28ad28', '#6C584C'
];

// --- VARIABLES OBRA 3 ---
let faseAplauso3 = 0;
let desfasePorCapa3 = 2;
let suavidadDegrade3 = 0.6;
let coloresLeParc3 = [
  '#E31B23', '#F04E37', '#FF6600', '#FFD700', '#FFCC00',
  '#00A859', '#7BC043', '#556B2F', '#48C9B0',
  '#1A479D', '#0070BB', '#4A90E2', '#008080',
  '#6C2D84', '#9E1B62', '#8B008B',
  '#D4AF37', '#A52A2A'
];
let coloresP5_3 = [];

function setup() {
  ajustarDimensiones();
  createCanvas(tamanoLienzo, tamanoLienzo);
  rectMode(CENTER);
  ellipseMode(CENTER);

  mic = new p5.AudioIn();
  fft = new p5.FFT();
  fft.setInput(mic); 

  for (let i = 0; i < coloresLeParc3.length; i++) {
    coloresP5_3.push(color(coloresLeParc3[i]));
  }
}

function draw() {
  if (getAudioContext().state !== 'running') {
    background(30);
    fill(220);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("Hacé CLIC en la pantalla para activar el micrófono.", width / 2, height / 2);
    return;
  }

  if (!micIniciado) {
    mic.start();
    micIniciado = true;
  }

  let volumen = mic.getLevel();
  fft.analyze(); 

  // --- ANÁLISIS DE TONOS (HÍPER SENSIBLE) ---
  energiaGrave = fft.getEnergy(80, 240);    
  energiaAguda = fft.getEnergy(350, 1000);  

  // Calibración ultra reactiva: topes máximos reducidos para no tener que gritar
  let modGrave = map(energiaGrave, 0, 75, 0, 0.8);  
  let modAguda = map(energiaAguda, 0, 55, 0, 0.7);  

  factorFrecuencia = 1.0 + modGrave - modAguda;
  factorFrecuencia = constrain(factorFrecuencia, 0.25, 1.75);

  // --- DETECTOR DE APLAUSO ---
  if (volumen >= 0.08 && millis() - ultimoAplauso > 500) {
    obraActual = (obraActual + 1) % 3; 
    
    avanceColor1 += floor(random(3, 10));
    avanceColor2 += floor(random(3, 10));
    faseAplauso3 += 1.0;
    
    ultimoAplauso = millis();
  }

  // --- RENDERIZADO DE OBRAS ---
  if (obraActual === 0) {
    dibujarObra1();
  } else if (obraActual === 1) {
    dibujarObra2();
  } else if (obraActual === 2) {
    dibujarObra3();
  }

  // --- MONITOR GLOBAL (Visible en todas las pantallas) ---
  dibujarMonitorGlobal();
}

// ==========================================
// RENDER DE CADA OBRA
// ==========================================

function dibujarObra1() {
  angleMode(DEGREES);
  background(240);
  randomSeed(12345);

  for (let i = 0; i < columnas; i++) {
    for (let j = 0; j < filas; j++) {
      let x = i * tamanoCelda + tamanoCelda / 2;
      let y = j * tamanoCelda + tamanoCelda / 2;

      let capa = min(i, j, columnas - 1 - i, filas - 1 - j);
      let largoCapa = columnas - 2 * capa;
      let localI = i - capa;
      let localJ = j - capa;
      
      let posPerimetro = 0;
      if (localJ === 0) { posPerimetro = localI; } 
      else if (localI === largoCapa - 1) { posPerimetro = (largoCapa - 1) + localJ; } 
      else if (localJ === largoCapa - 1) { posPerimetro = 2 * (largoCapa - 1) + (largoCapa - 1 - localI); } 
      else if (localI === 0) { posPerimetro = 3 * (largoCapa - 1) + (largoCapa - 1 - localJ); }

      let velocidadColor = 0.6;
      let fuerzaDesfase = 7;
      let indiceCalculado = floor(posPerimetro * velocidadColor + (capa * fuerzaDesfase) + avanceColor1);
      
      let indiceFondo = abs(floor(posPerimetro * 0.4 + capa)) % coloresFondo1.length;
      let colFondo = coloresFondo1[indiceFondo];

      fill(colFondo);
      noStroke();
      rect(x, y, tamanoCelda, tamanoCelda);

      let indiceForma = ((indiceCalculado % coloresLeParc1.length) + coloresLeParc1.length) % coloresLeParc1.length;
      let colForma = coloresLeParc1[indiceForma];

      let factorTamano = random(0.50, 0.85);
      let diametroFinal = tamanoCelda * factorTamano * factorFrecuencia;

      fill(colForma);
      let probabilidadForma = random(100);
      
      push();
      translate(x, y);
      if (probabilidadForma < 12) {
        let angulo = random([0, 45, 90, 135]);
        rotate(angulo);
        ellipse(0, 0, diametroFinal * 1.15, diametroFinal * 0.45);
      } else {
        ellipse(0, 0, diametroFinal, diametroFinal);
      }
      pop();
    }
  }
}

function dibujarObra2() {
  angleMode(RADIANS);
  background(20);

  for (let i = 0; i < columnas; i++) {
    for (let j = 0; j < filas; j++) {
      let x = i * tamanoCelda + tamanoCelda / 2;
      let y = j * tamanoCelda + tamanoCelda / 2;

      let capa = min(i, j, columnas - 1 - i, filas - 1 - j);
      let largoCapa = columnas - 2 * capa;
      let localI = i - capa;
      let localJ = j - capa;

      let posPerimetro = 0;
      if (localJ === 0) { posPerimetro = localI; }
      else if (localI === largoCapa - 1) { posPerimetro = (largoCapa - 1) + localJ; }
      else if (localJ === largoCapa - 1) { posPerimetro = 2 * (largoCapa - 1) + (largoCapa - 1 - localI); }
      else if (localI === 0) { posPerimetro = 3 * (largoCapa - 1) + (largoCapa - 1 - localJ); }

      let t = (posPerimetro + capa * 2) / (columnas * 1.5);
      t = t % 1;

      let cRojo = color('#D62828');
      let cAmarillo = color('#E9C46A');
      let cVerde = color('#28ad28');
      let cVioleta = color('#d39cd6');
      let cAzul = color('#0d4aa1');

      let colFondo;
      if (t < 0.2) { colFondo = lerpColor(cRojo, cAmarillo, t / 0.2); }
      else if (t < 0.4) { colFondo = lerpColor(cAmarillo, cVerde, (t - 0.2) / 0.2); }
      else if (t < 0.6) { colFondo = lerpColor(cVerde, cVioleta, (t - 0.4) / 0.2); }
      else if (t < 0.8) { colFondo = lerpColor(cVioleta, cAzul, (t - 0.6) / 0.2); }
      else { colFondo = lerpColor(cAzul, cRojo, (t - 0.8) / 0.2); }

      fill(colFondo);
      noStroke();
      rect(x, y, tamanoCelda, tamanoCelda);

      let fuerzaDesfase = 9;
      let indiceCalculado = floor(posPerimetro * 0.6 + (capa * fuerzaDesfase) + avanceColor2);
      let indiceForma = ((indiceCalculado % coloresLeParc2.length) + coloresLeParc2.length) % coloresLeParc2.length;
      fill(coloresLeParc2[indiceForma]);

      let tamanoForma = tamanoCelda * 0.7 * factorFrecuencia;

      if ((i + j) % 2 === 0) {
        ellipse(x, y, tamanoForma, tamanoForma);
      } else {
        rect(x, y, tamanoForma, tamanoForma);
      }
    }
  }
}

function dibujarObra3() {
  angleMode(RADIANS);
  background(240);

  for (let i = 0; i < columnas; i++) {
    for (let j = 0; j < filas; j++) {
      let x = i * tamanoCelda + tamanoCelda / 2;
      let y = j * tamanoCelda + tamanoCelda / 2;

      let capa = min(i, j, columnas - 1 - i, filas - 1 - j);
      let largoCapa = columnas - 2 * capa;
      let localI = i - capa;
      let localJ = j - capa;
      let posPerimetro = 0;

      if (localJ === 0) { posPerimetro = localI; } 
      else if (localI === largoCapa - 1) { posPerimetro = (largoCapa - 1) + localJ; } 
      else if (localJ === largoCapa - 1) { posPerimetro = 2 * (largoCapa - 1) + (largoCapa - 1 - localI); } 
      else if (localI === 0) { posPerimetro = 3 * (largoCapa - 1) + (largoCapa - 1 - localJ); }

      let posicionFlotante = (posPerimetro * suavidadDegrade3) + (capa * desfasePorCapa3) + faseAplauso3;
      
      let totalColores = coloresP5_3.length;
      let indiceActual = Math.floor(posicionFlotante) % totalColores;
      if (indiceActual < 0) indiceActual += totalColores;
      
      let indiceSiguiente = (indiceActual + 1) % totalColores;
      let amt = posicionFlotante - Math.floor(posicionFlotante);

      let colFondo = lerpColor(coloresP5_3[indiceActual], coloresP5_3[indiceSiguiente], amt);

      let posicionFlotanteCirculo = posicionFlotante + 4;
      let indiceActualCirculo = Math.floor(posicionFlotanteCirculo) % totalColores;
      if (indiceActualCirculo < 0) indiceActualCirculo += totalColores;
      let indiceSiguienteCirculo = (indiceActualCirculo + 1) % totalColores;
      let amtCirculo = posicionFlotanteCirculo - Math.floor(posicionFlotanteCirculo);
      
      let colForma = lerpColor(coloresP5_3[indiceActualCirculo], coloresP5_3[indiceSiguienteCirculo], amtCirculo);

      fill(colFondo);
      noStroke();
      rect(x, y, tamanoCelda, tamanoCelda);

      let factorRandom = abs(Math.sin(i * 12.9898 + j * 78.233));
      let tamanoCirculo = tamanoCelda * map(factorRandom, 0, 1, 0.35, 0.85) * factorFrecuencia;

      fill(colForma);
      ellipse(x, y, tamanoCirculo, tamanoCirculo);
    }
  }
}

// ==========================================
// FUNCIÓN NUEVA: HUD / MONITOR DE AUDIO GLOBAL
// ==========================================

function dibujarMonitorGlobal() {
  push();
  rectMode(CORNER);
  
  // Contenedor semitransparente abajo a la izquierda
  fill(0, 190);
  noStroke();
  rect(15, height - 105, 115, 90, 8);
  
  // Barra de Frecuencias Graves (Verde)
  fill(0, 255, 120);
  let alturaGrave = map(energiaGrave, 0, 255, 0, 50);
  rect(30, height - 35, 22, -alturaGrave);
  
  // Barra de Frecuencias Agudas (Rojo/Rosa)
  fill(255, 60, 120);
  let alturaAguda = map(energiaAguda, 0, 255, 0, 50);
  rect(65, height - 35, 22, -alturaAguda);
  
  // Etiquetas de las barras
  fill(255);
  textSize(11);
  textAlign(CENTER, TOP);
  text("G", 41, height - 30);
  text("A", 76, height - 30);
  
  // Texto dinámico con el multiplicador exacto
  textAlign(LEFT, TOP);
  textSize(10);
  fill(220);
  text("Escala: x" + factorFrecuencia.toFixed(2), 25, height - 95);
  
  pop();
}

// ==========================================
// OPERACIONES DE SISTEMA
// ==========================================

function ajustarDimensiones() {
  tamanoLienzo = min(windowWidth, windowHeight);
  tamanoCelda = tamanoLienzo / columnas;
}

function windowResized() {
  ajustarDimensiones();
  resizeCanvas(tamanoLienzo, tamanoLienzo);
}

function activarAudio() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
    userStartAudio();
  }
  if (!micIniciado) {
    mic.start();
    micIniciado = true;
  }
}

function mousePressed() { activarAudio(); }
function touchStarted() { activarAudio(); }
