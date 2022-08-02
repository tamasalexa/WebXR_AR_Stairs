/**
 * @author mrdoob / http://mrdoob.com
 * @author Mugen87 / https://github.com/Mugen87
 * @author NikLever / http://niklever.com
 */

class ARButton{

	constructor( renderer, options ) {
        this.renderer = renderer;
        
        if (options !== undefined){
            this.onSessionStart = options.onSessionStart;
            this.onSessionEnd = options.onSessionEnd;
            this.sessionInit = options.sessionInit;
            this.onClickFnCallback = options.onClickFnCallback;
        }
        
        if ('xr' in navigator) {

			const button = document.createElement( 'button' );
            button.style.display = 'none';
            

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( ( supported ) => {
                button.style.display = '';
				supported ? this.showStartAR( button ) : this.showARNotSupported( button );

			} );
            
            document.body.appendChild( button );

		} else {

			const message = document.createElement( 'a' );

			if ( window.isSecureContext === false ) {

				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS'; 

			} else {

				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';

			}

			message.style.left = '0px';
			message.style.width = '100%';
			message.style.textDecoration = 'none';

			this.stylizeElement( message, false );
            message.style.bottom = '0px';
            message.style.opacity = '1';
            
            document.body.appendChild ( message );
		}
    }

	showStartAR( button ) {
        const self = this;

        self.stylizeElement(button, true);       

        let currentSession = null;
        
        function onSessionStarted(session) {
            session.addEventListener( 'end', onSessionEnded );

            self.renderer.xr.setReferenceSpaceType( 'local' );
            self.renderer.xr.setSession( session );
            self.stylizeElement( button, false );
            
            //button.textContent = 'STOP AR';

            currentSession = session;
            
            if (self.onSessionStart !== undefined && self.onSessionStart !== null) self.onSessionStart();            
        }

        function onSessionEnded( ) {

            currentSession.removeEventListener( 'end', onSessionEnded );

            self.stylizeElement( button, true);
            //button.textContent = 'START AR';

            currentSession = null;
            
            if (self.onSessionEnd !== undefined && self.onSessionEnd !== null) self.onSessionEnd();
        }

        //button.onmouseenter = function () {            
        //    button.textContent = (currentSession===null) ? 'START AR' : 'STOP AR';
        //    button.style.opacity = '1.0';
        //};

        //button.onmouseleave = function () {                        
        //    button.innerHTML = '<i class="fas fa-camera"></i>';
        //    button.style.opacity = '0.5';
        //};

        button.onclick = function () {

            if ( currentSession === null ) {

                // WebXR's requestReferenceSpace only works if the corresponding feature
                // was requested at session creation time. For simplicity, just ask for
                // the interesting ones as optional features, but be aware that the
                // requestReferenceSpace call will fail if it turns out to be unavailable.
                // ('local' is always available for immersive sessions and doesn't need to
                // be requested separately.)
                
                navigator.xr.requestSession( 'immersive-ar', self.sessionInit ).then( onSessionStarted );
                self.onClickFnCallback();
                console.log("self.onClickFnCallback", self.onClickFnCallback);
            } else {
                currentSession.end();
            }
        };
    }

    disableButton(button) {

        //button.style.cursor = 'auto';
        //button.style.opacity = '0.5';
        
        button.onmouseenter = null;
        button.onmouseleave = null;

        button.onclick = null;

    }

    showARNotSupported(button) {        
        this.disableButton(button);

        button.textContent = 'AR NOT SUPPORTED';

        button.style.position= 'absolute';
        button.style.right= '0px';
        button.style.top= '0px';
        button.style.width = '100%';
        button.style.height = '40px';
        button.style.background = '#B41414';
        button.style.color = '#FFFFFF';
        button.style.fontSize ='20px';
        button.style.textAlign = 'center';
        button.style.opacity = '1';
    }

    //stylizeElement( element, active = true, fontSize = 13, ignorePadding = false ) {
    stylizeElement(element, active = true) {
        element.style = "";
        element.style.display = '';        
        element.style.position = 'absolute';

        if (active) {
            element.innerHTML = '<i class="fas fa-camera  fa-5x"></i>';
            element.style.width = '200px';
            element.style.height = '200px';
            element.style.left = '50%';
            element.style.top = '50%';
            element.style.marginLeft = '-100px';
            element.style.top = '50%';
            element.style.marginTop = '-100px';
        } else {
            element.innerHTML = '<i class="fas fa-camera  fa-2x"></i>';
            element.style.right = '10px';
            element.style.bottom = '10px';
            element.style.width = '80px';
            element.style.height = '80px';            
        }

        element.style.cursor = 'pointer';       
        //if (!ignorePadding) element.style.padding = '12px 6px';
        element.style.border = '1px solid #fff';
        element.style.borderRadius = '15px';
        element.style.background = (active) ? 'rgba(20,150,80,1)' : 'rgba(180,20,20,1)';
        element.style.color = '#fff';
        element.style.fontSize = `20px`;
        element.style.textAlign = 'center';
        element.style.opacity = '0.5';
        element.style.outline = 'none';
        element.style.zIndex = '999';

    }

		

};

export { ARButton };
