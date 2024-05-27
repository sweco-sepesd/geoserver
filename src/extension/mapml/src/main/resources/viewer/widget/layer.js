/*! @maps4html/web-map-custom-element 29-04-2024 */

import"./leaflet.js";import"./mapml.js";class MapLayer extends HTMLElement{static get observedAttributes(){return["src","label","checked","hidden","opacity"]}#hasConnected;get src(){return this.hasAttribute("src")?this.getAttribute("src"):""}set src(e){e&&this.setAttribute("src",e)}get label(){return this._layer?this._layer.getName():this.hasAttribute("label")?this.getAttribute("label"):""}set label(e){e&&this.setAttribute("label",e)}get checked(){return this.hasAttribute("checked")}set checked(e){e?this.setAttribute("checked",""):this.removeAttribute("checked")}get hidden(){return this.hasAttribute("hidden")}set hidden(e){e?this.setAttribute("hidden",""):this.removeAttribute("hidden")}get opacity(){return+(this._opacity??this.getAttribute("opacity"))}set opacity(e){1<+e||+e<0||this.setAttribute("opacity",e)}get extent(){return this._layer&&!this._layer.bounds&&this._layer._calculateBounds(),this._layer?Object.assign(M._convertAndFormatPCRS(this._layer.bounds,M[this.getProjection()],this.getProjection()),{zoom:this._layer.zoomBounds}):null}attributeChangedCallback(e,t,r){if(this.#hasConnected)switch(e){case"label":this._layer.setName(r);break;case"checked":"string"==typeof r?this.parentElement._map.addLayer(this._layer):this.parentElement._map.removeLayer(this._layer),this._layerControlCheckbox.checked=this.checked,this.dispatchEvent(new CustomEvent("map-change"));break;case"hidden":"string"==typeof r?this._layerControl.removeLayer(this._layer):(this._layerControl.addOrUpdateOverlay(this._layer,this.label),this._validateDisabled());break;case"opacity":t!==r&&this._layer&&(this._opacity=r,this._layer.changeOpacity(r));break;case"src":t!==r&&(this._onRemove(),this.isConnected&&this._onAdd())}}constructor(){super(),this._opacity=this.opacity||1,this._renderingMapContent=M.options.contentPreference,this.attachShadow({mode:"open"})}disconnectedCallback(){this.hasAttribute("data-moving")||this._onRemove()}_onRemove(){this._observer&&this._observer.disconnect();let e=this._layer,t=this._layerControl;this._layerControlHTML;delete this._layer,delete this._layerControl,delete this._layerControlHTML,delete this._fetchError,this.shadowRoot.innerHTML="",this.src&&(this.innerHTML=""),e&&e.off(),e&&e._map&&e._map.removeLayer(e),t&&!this.hidden&&t.removeLayer(e)}connectedCallback(){if(!this.hasAttribute("data-moving")){this.#hasConnected=!0,this._createLayerControlHTML=M._createLayerControlHTML.bind(this);const e=this._onAdd.bind(this),t=this._onRemove.bind(this);this.parentElement.whenReady().then(()=>{t(),e()}).catch(e=>{throw new Error("Map never became ready: "+e)})}}_onAdd(){new Promise((e,a)=>{this.addEventListener("changestyle",function(e){e.stopPropagation(),e.detail&&(this._renderingMapContent=e.detail._renderingMapContent,this.src=e.detail.src)},{once:!0}),this.addEventListener("zoomchangesrc",function(e){e.stopPropagation(),this.src=e.detail.href},{once:!0});let t=this.baseURI||document.baseURI;const r=new Headers;if(r.append("Accept","text/mapml"),this.src)fetch(this.src,{headers:r}).then(e=>{if(!e.ok)throw new Error("HTTP error! Status: "+e.status);return e.text()}).then(e=>{let t=(new DOMParser).parseFromString(e,"text/xml");if(t.querySelector("parsererror")||!t.querySelector("mapml-"))throw this._fetchError=!0,console.log("Error fetching layer content:\n\n"+e+"\n"),new Error("Parser error");return t}).then(e=>{this.copyRemoteContentToShadowRoot(e.querySelector("mapml-"));let t=this.shadowRoot.querySelectorAll("*"),r=[];for(let e=0;e<t.length;e++)t[e].whenReady&&r.push(t[e].whenReady());return Promise.allSettled(r)}).then(()=>{this.selectAlternateOrChangeProjection(),this.checkForPreferredContent()}).then(()=>{this._layer=M.mapMLLayer(new URL(this.src,t).href,this,{projection:this.getProjection(),opacity:this.opacity}),this._createLayerControlHTML(),this._attachedToMap(),this._runMutationObserver(this.shadowRoot.children),this._bindMutationObserver(),this._validateDisabled(),this.dispatchEvent(new CustomEvent("loadedmetadata",{detail:{target:this}})),e()}).catch(e=>{a(e)});else{let t=this.querySelectorAll("*"),r=[];for(let e=0;e<t.length;e++)t[e].whenReady&&r.push(t[e].whenReady());Promise.allSettled(r).then(()=>{this.selectAlternateOrChangeProjection(),this.checkForPreferredContent()}).then(()=>{this._layer=M.mapMLLayer(null,this,{projection:this.getProjection(),opacity:this.opacity}),this._createLayerControlHTML(),this._attachedToMap(),this._runMutationObserver(this.children),this._bindMutationObserver(),this._validateDisabled(),this.dispatchEvent(new CustomEvent("loadedmetadata",{detail:{target:this}})),e()}).catch(e=>{a(e)})}}).catch(e=>{"changeprojection"===e.message?e.cause.href?(console.log("Changing layer src to: "+e.cause.href),this.src=e.cause.href):e.cause.mapprojection&&(console.log("Changing map projection to match layer: "+e.cause.mapprojection),this.parentElement.projection=e.cause.mapprojection):"findmatchingpreferredcontent"===e.message?e.cause.href&&(console.log("Changing layer to matching preferred content at: "+e.cause.href),this.src=e.cause.href):"Failed to fetch"===e.message?this._fetchError=!0:(console.log(e),this.dispatchEvent(new CustomEvent("error",{detail:{target:this}})))})}selectAlternateOrChangeProjection(){let e=this.src?this.shadowRoot:this,t=this.getProjection()!==this.parentElement.projection&&e.querySelector("map-link[rel=alternate][projection="+this.parentElement.projection+"][href]");if(t){var r=new URL(t.getAttribute("href"),t.getBase()).href;throw new Error("changeprojection",{cause:{href:r}})}r=this.getProjection();if(r!==this.parentElement.projection&&1===this.parentElement.layers.length)throw new Error("changeprojection",{cause:{mapprojection:r}})}checkForPreferredContent(){let e=this.src?this.shadowRoot:this,t=e.querySelector(`map-link[rel="style"][media="prefers-map-content=${this._renderingMapContent}"][href]`);if(t){var r=new URL(t.getAttribute("href"),t.getBase()).href;throw new Error("findmatchingpreferredcontent",{cause:{href:r}})}}copyRemoteContentToShadowRoot(e){let t=this.shadowRoot,r=document.createDocumentFragment();var a=e.querySelectorAll("map-head > *, map-body > *");for(let e=0;e<a.length;e++)r.appendChild(a[e]);t.appendChild(r)}getProjection(){let e=this.src?this.shadowRoot:this,t=this.parentElement.projection;return e.querySelector("map-meta[name=projection][content]")?t=M._metaContentToObject(e.querySelector("map-meta[name=projection]").getAttribute("content")).content||t:e.querySelector("map-extent[units]")?t=(t=>{var r=t[0].attributes.units.value;let a=!0;for(let e=0;e<t.length;e++)r!==t[e].attributes.units.value&&(a=!1);return a?r:null})(Array.from(e.querySelectorAll("map-extent[units]")))||t:console.log(`A projection was not assigned to the '${e.label}' Layer. Please specify a projection for that layer using a map-meta element. See more here - https://maps4html.org/web-map-doc/docs/elements/meta/`),t}_runMutationObserver(r){var a=e=>{this.whenReady().then(()=>{delete this._layer.bounds,e.addFeature(this._layer._mapmlvectors)})},i=e=>{this.whenReady().then(()=>{this._layer.appendStyleLink(e)})},s=e=>{this.whenReady().then(()=>{this._layer.appendStyleElement(e)})},o=e=>{this.whenReady().then(()=>{delete this._layer.bounds,this._validateDisabled()})};let n=this.src?this.shadowRoot:this,h=n instanceof ShadowRoot?":host":":scope";var l=e=>{this.whenReady().then(()=>{this._layer._calculateBounds(),this._validateDisabled()})};for(let t=0;t<r.length;++t){let e=r[t];switch(e.nodeName){case"MAP-FEATURE":a(e);break;case"MAP-LINK":e.link&&!e.link.isConnected&&i(e);break;case"MAP-STYLE":e.styleElement&&!e.styleElement.isConnected&&s(e);break;case"MAP-EXTENT":o(e);break;case"MAP-META":e.hasAttribute("name")&&("zoom"===e.getAttribute("name").toLowerCase()||"extent"===e.getAttribute("name").toLowerCase())&&e===n.querySelector(h+` > [name=${e.getAttribute("name")}]`)&&e.hasAttribute("content")&&l(e)}}}_bindMutationObserver(){this._observer=new MutationObserver(e=>{for(var t of e)"childList"===t.type&&this._runMutationObserver(t.addedNodes)}),this._observer.observe(this.src?this.shadowRoot:this,{childList:!0})}_attachedToMap(){for(var e=0,t=1,r=this.parentNode.children;e<r.length;e++)"LAYER-"===this.parentNode.children[e].nodeName&&(this.parentNode.children[e]===this?t=e+1:this.parentNode.children[e]._layer&&this.parentNode.children[e]._layer.setZIndex(e+1));var a=this.parentNode.projection||"OSMTILE";L.setOptions(this._layer,{zIndex:t,mapprojection:a,opacity:window.getComputedStyle(this).opacity}),this._layer._map=this.parentNode._map,this.checked&&this._layer.addTo(this._layer._map),this._layer.on("add remove",this._validateDisabled,this),this._layer._map.on("moveend layeradd",this._validateDisabled,this),this.parentNode._layerControl&&(this._layerControl=this.parentNode._layerControl),this.parentNode._layerControl&&!this.hidden&&this._layerControl.addOrUpdateOverlay(this._layer,this.label),this._layer._legendUrl&&(this.legendLinks=[{type:"application/octet-stream",href:this._layer._legendUrl,rel:"legend",lang:null,hreflang:null,sizes:null}])}_validateDisabled(){setTimeout(()=>{let s=this._layer,e=s?._map;if(e){this._validateLayerZoom({zoom:e.getZoom()});const o=(this.src?this.shadowRoot:this).querySelectorAll("map-extent");let t=[];for(let e=0;e<o.length;e++)t.push(o[e].whenLinksReady());Promise.allSettled(t).then(()=>{let t=0,r=0,a=["_staticTileLayer","_mapmlvectors","_extentLayer"];for(let e=0;e<a.length;e++){var i=a[e];if(this.checked)if("_extentLayer"===i&&0<o.length)for(let e=0;e<o.length;e++)r++,o[e]._validateDisabled()&&t++;else s[i]&&(r++,s[i].isVisible()||t++)}t===r&&0!==t?(this.setAttribute("disabled",""),this.disabled=!0):(this.removeAttribute("disabled"),this.disabled=!1),this.toggleLayerControlDisabled()}).catch(e=>{console.log(e)})}},0)}_validateLayerZoom(e){var t=e.zoom,r=this.extent.zoom.minZoom,a=this.extent.zoom.maxZoom,i=(this.src?this.shadowRoot:this).querySelector("map-link[rel=zoomin]"),e=(this.src?this.shadowRoot:this).querySelector("map-link[rel=zoomout]");let s;r<=t&&t<=a||(i&&a<t?s=i.href:e&&t<r&&(s=e.href),s&&this.dispatchEvent(new CustomEvent("zoomchangesrc",{detail:{href:s}})))}toggleLayerControlDisabled(){let e=this._layerControlCheckbox,t=this._layerControlLabel,r=this._opacityControl,a=this._opacitySlider,i=this._styles;this.disabled?(e.disabled=!0,a.disabled=!0,t.style.fontStyle="italic",r.style.fontStyle="italic",i&&(i.style.fontStyle="italic",i.querySelectorAll("input").forEach(e=>{e.disabled=!0}))):(e.disabled=!1,a.disabled=!1,t.style.fontStyle="normal",r.style.fontStyle="normal",i&&(i.style.fontStyle="normal",i.querySelectorAll("input").forEach(e=>{e.disabled=!1})))}queryable(){let e=this.src?this.shadowRoot:this;return e.querySelector("map-extent[checked] > map-link[rel=query]")&&this.checked&&this._layer&&!this.hidden}getAlternateStyles(e){if(1<e.length){var t=document.createElement("details"),r=document.createElement("summary");r.innerText="Style",t.appendChild(r);for(var a=0;a<e.length;a++)t.appendChild(e[a].getLayerControlOption()),L.DomUtil.addClass(t,"mapml-layer-item-style mapml-control-layers");return t}}getOuterHTML(){let t=this.cloneNode(!0);if(this.hasAttribute("src")&&(e=this._layer.getHref(),t.setAttribute("src",e)),this.querySelector("map-link")){let e=t.querySelectorAll("map-link");e.forEach(e=>{e.hasAttribute("href")?e.setAttribute("href",decodeURI(new URL(e.attributes.href.value,this.baseURI||document.baseURI).href)):e.hasAttribute("tref")&&e.setAttribute("tref",decodeURI(new URL(e.attributes.tref.value,this.baseURI||document.baseURI).href))})}var e=t.outerHTML;return t.remove(),e}zoomTo(){this.whenReady().then(()=>{let e=this.parentElement._map,t=this.extent,r=t.topLeft.pcrs,a=t.bottomRight.pcrs,i=L.bounds(L.point(r.horizontal,r.vertical),L.point(a.horizontal,a.vertical)),s=e.options.crs.unproject(i.getCenter(!0));var o=t.zoom.maxZoom,n=t.zoom.minZoom;e.setView(s,M.getMaxZoom(i,e,n,o),{animate:!1})})}mapml2geojson(e={}){return M.mapml2geojson(this,e)}pasteFeature(e){switch(typeof e){case"string":e.trim(),"<map-feature"===e.slice(0,12)&&"</map-feature>"===e.slice(-14)&&this.insertAdjacentHTML("beforeend",e);break;case"object":"MAP-FEATURE"===e.nodeName.toUpperCase()&&this.appendChild(e)}}whenReady(){return new Promise((t,r)=>{let a,i;this._layer&&this._layerControlHTML&&(!this.src||this.shadowRoot?.childNodes.length)?t():(a=setInterval(function(e){e._layer&&e._layerControlHTML&&(!e.src||e.shadowRoot?.childNodes.length)?(clearInterval(a),clearTimeout(i),t()):e._fetchError&&(clearInterval(a),clearTimeout(i),r("Error fetching layer content"))},200,this),i=setTimeout(function(){clearInterval(a),clearTimeout(i),r("Timeout reached waiting for layer to be ready")},5e3))})}whenElemsReady(){let e=[],t=this.src?this.shadowRoot:this;for(var r of[...t.querySelectorAll("map-extent"),...t.querySelectorAll("map-feature")])e.push(r.whenReady());return Promise.allSettled(e)}}export{MapLayer};
//# sourceMappingURL=layer.js.map