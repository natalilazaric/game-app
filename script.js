(() => {
    //osnovne varijable
    const canvas = document.getElementById('gameCanvas');
    const kontekst = canvas.getContext('2d');
    const sirina_canvas = canvas.width;
    const visina_canvas = canvas.height;
    const redci = 5;
    const stupci = 10;
    const margina = 40;
    const horizontalna_udaljenost = 30;
    const vertikalna_udaljenost = 15;
    const pravokutnik_sirina = 60;
    const pravokutnik_visina = 20;
    const palica_sirina = 100;
    const palica_visina = 12;
    const palica_brzina = 7
    const velicina_loptice = 8;
    const brzina_loptica = 4;

    const boje_pravokutnika = [
        'rgb(153,51,0)',    // smeđa (red 1)
        'rgb(255,0,0)',     // crvena (red 2)
        'rgb(255,153,204)', // ružičasta (red 3)
        'rgb(0,255,0)',     // zeleno (red 4)
        'rgb(255,255,153)'  // žuto (red 5)
    ];

    let bodovi = 0;
    let max_bodovi = parseInt(localStorage.getItem('max') || '0', 10);

    //stanja igre
    let trenutno = false;
    let gotovo = false;
    let pobjeda = false;

    const palica = {
        sirina: palica_sirina,
        visina: palica_visina,
        x: (sirina_canvas - palica_sirina) / 2,
        y: visina_canvas - 30,
        vx: 0                                       //brzina palice po x-osi
    };

    const loptica = {
        velicina: velicina_loptice,
        x: palica.x + (palica.sirina / 2) - (velicina_loptice / 2),
        y: palica.y - velicina_loptice,
        dx: 0,                                      //vektori brzine loptice po osima
        dy: 0,
        brzina: brzina_loptica
    };

    const pravokutnici = [];

    const tipke = {
        lijevo: false,
        desno: false
    };

    //stvaranje 3D efekta kod elemenata igre
    function efekt3D(x, y, w, h, boja) {
        //sjencanje ruba cigli
        kontekst.shadowColor = 'rgba(245, 242, 242, 0.88)';
        kontekst.shadowOffsetX = 2;               
        kontekst.shadowOffsetY = 2;               
        kontekst.shadowBlur = 4;

        //popunjavanje cigle
        kontekst.fillStyle = boja;
        kontekst.fillRect(x, y, w, h);
        kontekst.shadowColor = 'transparent';
    }
    
    //kretanje loptice kad zapocnemo igru
    function lopticaPocetak(){
        const dir = Math.random() < 0.5 ? -1 : 1;
        loptica.dx = dir * loptica.brzina;
        loptica.dy = -loptica.brzina;
    }

    //standardna AABB funkcija za provjeru presjeka dva pravokutnika
    function kolizija(ax, ay, aw, ah, bx, by, bw, bh){
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function kolizijaZid(){
        //sudar s lijevom ili desnom stranom canvasa
        if (loptica.x <= 0){
            loptica.x = 0;
            loptica.dx = Math.abs(loptica.dx);  //kretanje udesno

        }else if(loptica.x + loptica.velicina >= sirina_canvas){
            loptica.x = sirina_canvas - loptica.velicina;
            loptica.dx = -Math.abs(loptica.dx);  //kretanje ulijevo
        }
        //sudar s gornjim rubom canvasa
        if (loptica.y <= 0){
            loptica.y = 0;
            loptica.dy = Math.abs(loptica.dy);  //kretanje dolje
        }
        //sudar s donjim rubom canvasa i kraj igre
        if(loptica.y + loptica.velicina >= visina_canvas){
            trenutno = false;
            gotovo = true;
            if(bodovi > max_bodovi){
                max_bodovi = bodovi;
                localStorage.setItem('max', String(max_bodovi));
            }
        }
    }

    function kolizijaPalica(){
        //provjera postoji li preklapanje loptice i palice
        if(kolizija(loptica.x, loptica.y, loptica.velicina, loptica.velicina, palica.x, palica.y, palica.sirina, palica.visina)){
            
            //odbijanje loptice prema gore i ovisno o strani palice koju je udarila na tu stranu ide
            loptica.dy = -Math.abs(loptica.dy);

            if (loptica.x + loptica.velicina / 2 < palica.x + palica.sirina / 2) {
                loptica.dx = -Math.abs(loptica.dx);      //pogodak lijeve polovice palice, ide lijevo
            } 
            else {
                loptica.dx = Math.abs(loptica.dx);    //pogodak desne polovice palice, ide desno
            }
            loptica.y = palica.y - loptica.velicina - 1;
        }
    }

    function kolizijaCigle(){
        for (const p of pravokutnici){
            //provjera vidljivosti cigle i postoji li kolizija cigle i loptice
            if(!p.vidljivost) continue;
            if(kolizija(loptica.x, loptica.y, loptica.velicina, loptica.velicina, p.x, p.y, p.sirina, p.visina)){
                
                //prethodne pozicije loptice
                const prevX = loptica.x - loptica.dx;
                const prevY = loptica.y - loptica.dy;

                //određivanje strane udarca loptice u ciglu
                const lijevo = prevX + loptica.velicina <= p.x;
                const desno = prevX >= p.x + p.sirina;
                const gore = prevY + loptica.velicina <=p.y;
                const dolje = prevY >= p.y + p.visina;

                //određivanje odbijanja loptice i mjenjanje smjera
                if ((lijevo && !gore && !dolje) || (desno && !gore && !dolje)) {
                    if (loptica.dx > 0) {
                        loptica.dx = -loptica.brzina;
                    } else {
                        loptica.dx = loptica.brzina;
                    }
                } else if ((gore && !lijevo && !desno) || (dolje && !lijevo && !desno)) {
                    if (loptica.dy > 0) {
                        loptica.dy = -loptica.brzina;
                    } else {
                        loptica.dy = loptica.brzina;
                    }
                } else {
                    loptica.brzina *= 1.05;
                    if (loptica.dx > 0) {
                        loptica.dx = -loptica.brzina;
                    } else {
                        loptica.dx = loptica.brzina;
                    }
                    if (loptica.dy > 0) {
                        loptica.dy = -loptica.brzina;
                    } else {
                        loptica.dy = loptica.brzina;
                    }
                }

                //cigla se ne prikazuje, bodovi se povecavaju
                p.vidljivost = false;
                bodovi += 1;

                if (bodovi > max_bodovi){
                    max_bodovi = bodovi;
                    localStorage.setItem('max', String(max_bodovi));
                }

                //provjera pobjede
                const ostatak = pravokutnici.some(pr => pr.vidljivost);
                if(!ostatak){
                    trenutno = false;
                    pobjeda = true;
                }
                break;
            }
        }
    }

    function logika(){
        if(!trenutno) return;

        //pomak palice
        if(tipke.lijevo){
            palica.vx = -palica_brzina;
        }else if(tipke.desno){
            palica.vx = palica_brzina;
        }else{
            palica.vx = 0;
        }
        palica.x += palica.vx;

        //provjera da palica nije izvan canvasa
        if(palica.x < 0) palica.x = 0;
        if(palica.x + palica.sirina > sirina_canvas) palica.x = sirina_canvas - palica.sirina;

        //pomak loptice
        if(loptica.dx !== 0 || loptica.dy !== 0){
            const duljina_vektora = Math.sqrt(loptica.dx * loptica.dx + loptica.dy * loptica.dy)
            loptica.dx = (loptica.dx/duljina_vektora) * loptica.brzina;
            loptica.dy = (loptica.dy/duljina_vektora) * loptica.brzina;
            loptica.x += loptica.dx;
            loptica.y += loptica.dy;
        }else{
            lopticaPocetak();
        }

        //kolizije
        kolizijaZid();
        kolizijaPalica();
        kolizijaCigle();
    }

    function crtanje(){

        //crtanje i stvaranje 3d efekta svih potrebnih elemenata(canvas,cigle,palica,loptica)
        kontekst.fillStyle = 'black';
        kontekst.fillRect(0,0, sirina_canvas, visina_canvas);
        for (const p of pravokutnici){
            if(!p.vidljivost) continue;
            efekt3D(p.x, p.y, p.sirina, p.visina, p.boja);
        }
        efekt3D(palica.x, palica.y, palica.sirina, palica.visina, 'white');
        efekt3D(loptica.x, loptica.y, loptica.velicina, loptica.velicina, 'white');
        
        //prikaz trenutnih bodova i maksimalno osvojenih bodova
        kontekst.font = '16px Helvetica';
        kontekst.fillStyle = 'white';
        kontekst.textBaseline = 'top';
        kontekst.textAlign = 'left';
        kontekst.fillText('Bodovi: ' + bodovi, 20, 20);
        kontekst.textAlign = 'right';
        kontekst.fillText('Maks: ' + max_bodovi, sirina_canvas -100, 20);

        //prikaz tekstova ovisno o stanju igre
        if(!trenutno && !gotovo && !pobjeda){
            kontekst.textBaseline = 'middle';
            kontekst.font = 'bold 36px Helvetica';
            kontekst.fillStyle = 'white';
            kontekst.textAlign = 'center';
            kontekst.fillText('BREAKOUT', sirina_canvas/2, visina_canvas/2);
            kontekst.font = 'italic bold 18px Helvetica';
            kontekst.fillStyle = 'white';
            kontekst.fillText('Press SPACE to begin', sirina_canvas/2, visina_canvas/2 +28);
        }

        if(gotovo){
            kontekst.textBaseline = 'middle';
            kontekst.font = 'bold 40px Helvetica';
            kontekst.fillStyle = 'yellow';
            kontekst.textAlign = 'center';
            kontekst.fillText('GAME OVER', sirina_canvas/2, visina_canvas/2);
        }

        if(pobjeda){
            kontekst.textBaseline = 'middle';
            kontekst.font = 'bold 40px Helvetica';
            kontekst.fillStyle = 'yellow';
            kontekst.textAlign = 'center';
            kontekst.fillText('YOU WIN', sirina_canvas/2, visina_canvas/2);
        }
    }

    //beskonacni ciklus igre
    function loop(){
        logika();
        crtanje();
        if(!gotovo && !pobjeda){
            requestAnimationFrame(loop);
        }else{
            crtanje();
        }
    }

    //tipke za kretanje palice i pokretanje igre
    window.addEventListener('keydown', (e) => {
        if(e.key === 'a' || e.key === 'A'){
            tipke.lijevo = true;
        }else if(e.key === 's' || e.key === 'S'){
            tipke.desno = true;
        }else if (e.code === 'Space'){
            if(!trenutno && !gotovo && !pobjeda){
                trenutno = true;
                if(loptica.dx === 0 && loptica.dy === 0) lopticaPocetak();
            }else if (gotovo || pobjeda){
                init(true);
            }
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'a' || e.key === 'A') {
            tipke.lijevo = false;
        } else if (e.key === 's' || e.key === 'S') {
            tipke.desno = false;
        }
    });

    function init(reset = false){
        //ako je igra gotova
        if(reset){
            bodovi = 0;
            trenutno = false;
            gotovo = false;
            pobjeda = false;
        }
        palica.sirina = palica_sirina;
        palica.x = (sirina_canvas - palica.sirina) / 2;
        palica.y = visina_canvas - 30;
        
        //postavljanje loptice na sredinu palice
        loptica.velicina = velicina_loptice;
        loptica.x = palica.x + (palica.sirina / 2) - (loptica.velicina / 2);
        loptica.y = palica.y - loptica.velicina;
        loptica.brzina = brzina_loptica;
        loptica.dx = 0;
        loptica.dy = 0;
        
        //stvaranje cigli
        pravokutnici.length = 0;
        const max_sirina = stupci * pravokutnik_sirina + (stupci - 1) * horizontalna_udaljenost;
        const startX = Math.round((sirina_canvas - max_sirina) /2);
        for (let r=0; r < redci; r++){
            for (let s=0; s < stupci; s++){
                pravokutnici.push({
                    x: startX + s*(pravokutnik_sirina + horizontalna_udaljenost),
                    y: margina + r*(pravokutnik_visina + vertikalna_udaljenost),
                    sirina: pravokutnik_sirina,
                    visina: pravokutnik_visina,
                    boja: boje_pravokutnika[r],
                    vidljivost:true                                         //postoji li cigla
                });
            }
        }

        crtanje();
        requestAnimationFrame(loop);
    }

    init();

})();