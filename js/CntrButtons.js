class CntrButtons {
    
    constructor(options) {
        
        this.init();
    }

    init() {
        let scope = this;
        //btnRotateObj3D
        scope.btnRotateObj3D = document.createElement('button');
        scope.btnRotateObj3D.innerHTML = 'rotate';// '<i class="fas fa-arrows-rotate"></i>';  //'<i class="fa-thin fa-rotate"></i>';//"rotate";
        
        scope.btnRotateObj3D.style.fontSize = '20px';
        scope.btnRotateObj3D.style.width = '80px';
        scope.btnRotateObj3D.style.height = '80px';
        scope.btnRotateObj3D.style.position = 'absolute';
        scope.btnRotateObj3D.style.left = '50%';
        scope.btnRotateObj3D.style.marginLeft = '-40px';
        scope.btnRotateObj3D.style.bottom = '10px';
        scope.btnRotateObj3D.style.opacity = '0.5';
        scope.btnRotateObj3D.style.zIndex = '999';

        

        scope.btnRotateObj3D.addEventListener('mousedown', function () {            
            scope.rotateContinuously = setInterval(
                function () {
                    this.rotate();        
                }.bind(scope), 10);
        });

        scope.btnRotateObj3D.addEventListener('mouseup', () => { clearInterval(scope.rotateContinuously); });
        scope.btnRotateObj3D.addEventListener('mouseout', () => { clearInterval(scope.rotateContinuously); });

        scope.btnRotateObj3D.addEventListener('click', function () { this.rotate(); }.bind(scope));        
        
        this.hide();
        document.body.appendChild(this.btnRotateObj3D);
    }

    show() {
        if (this.btnRotateObj3D) {
            this.btnRotateObj3D.style.display = '';
        }
    }

    hide() {
        if (this.btnRotateObj3D) {
            this.btnRotateObj3D.style.display = 'none';
        }
    }

    rotate() {
        console.log("rotateObj3D", this);
        if (this.obj3D) {
            this.obj3D.rotateY(Math.PI / 100);
        }
    }
    
};

export { CntrButtons };