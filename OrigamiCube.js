//ver3.4
OrigamiCube={
    face:["上","前","右","後","左","下"],
    cbmp_st:[[1,0],[1,1],[2,1],[3,1],[0,1],[1,2]],
    setting:`<script src="https://cdn.jsdelivr.net/npm/equirect-cubemap-faces-js@2.3.0/index.js"></script>
      <script src="https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js"></script>
      <script src="font.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js"></script>
      <script src="https://unpkg.com/docx@7.1.0/build/index.js"></script>`,
    loadLib:function(){document.write(this.setting);},
    toCubemap:function(map){
	var result=equirectToCubemapFaces(map);
	return [
	    result[2],
	    result[4],
	    result[0],
	    result[5],
	    result[1],
	    result[3]
	];
    },
    rgbTo16:function(rgb){
        return "#" + rgb.map( function ( value ) {
          return ( "0" + value.toString( 16 ) ).slice( -2 ) ;} ).join( "" ) ;},
    cvToBuf:canvas =>{
      const dataURL = canvas.toDataURL();
      const imageBase64 = dataURL.split(',')[1];
      const decodeURL = atob( imageBase64 );
      const buffer = new Uint8Array(decodeURL.length);
      for( let i = 0 ; i < decodeURL.length ; i ++)
          buffer[i] = decodeURL.charCodeAt(i);
      return buffer;
    },
    toOrigami:function(canvas,cubemap){
        //準備
        var size=canvas.width/4;
        var side=cubemap.slice(1,5);
        var cv=canvas.getContext("2d");
	
	//マスク
	var mask={
	    tri_r:[[0,0],[0,size],[size/2,size/2]],
	    tri_l:[[size,0],[size,size],[size/2,size/2]]
	};
        
        //回転
	function rotate(canvas,angle){
	        //準備
		var cv=canvas.getContext("2d");
	        cv.save();
	        
	        //回転
	        cv.translate(canvas.width/2,canvas.height/2);
	        cv.rotate(angle*Math.PI/180);
	        cv.translate(-canvas.width/2,-canvas.height/2);
        }
        
        //配置
        function place(img,x_grid,y_grid,angle=0,mask=[]){
	    //準備
	    var x=parseInt(size*x_grid);
	    var y=parseInt(size*y_grid);
	    
	    const subcv=document.createElement("canvas");//画像処理用キャンバスを作成
	    subcv.width=size;//幅
	    subcv.height=size;//高さ
	    const facecv=subcv.getContext("2d");//描画面を取得
	    facecv.fillStyle="#000000";
	    facecv.fillRect(0,0,size,size);
	    
	    //回転
	    rotate(subcv,angle);//キャンバスを回転
	    facecv.drawImage(img,0,0,size,size);//画像を貼り付け
	    
	    //マスク
	    facecv.globalCompositeOperation="destination-in";//マスクモードに
	    facecv.beginPath();//描画開始
	    for(let c in mask){
		    let x,y;
		    [x,y]=mask[c];
		    (c==0)? (facecv.moveTo(x,y)):(facecv.lineTo(x,y));//線を引く
	    }
	    facecv.closePath();//描画終了
	    facecv.fill();//塗る
	    
	    //キャンバスに貼り付け
	    cv.drawImage(subcv,x,y);
        }
	
	place(cubemap[0],1.5,1.5);
	let angle=0;
	for(let c in side){
	    c=parseInt(c);
	    
	    let c_r=(side[c+1])? c+1:c+1-4;
	    let c_l=(side[c-1])? c-1:c-1+4;
	    
	    place(side[c],1.5,2.5);
	    place(side[c_l],0.5,2.5,0,mask.tri_l);
	    place(side[c_l],0.5,3.5,-90);
	    place(side[c_r],2.5,2.5,0,mask.tri_r);
	    place(side[c_r],2.5,3.5,90);
	    place(cubemap[5],1.5,3.5,angle);
	    
	    //キャンバスを回転
	    angle-=90;
	    cv.restore();
	    rotate(canvas,angle);
	}
	return canvas;
    },
    makePDF:function(doc_size){return new jspdf.jsPDF("p","cm",doc_size,true);},
    toPDF:function(canvas,doc_size,text,pdf,font="font"){
	const size={
	    a3:28,
            b4:24,
            a4:20,
            b5:16,
            a5:12,
            b6:10
	}[doc_size];
        const mar={
	    a3:0.85,
            b4:0.85,
            a4:0.5,
            b5:1.1,
            a5:1.4,
            b6:1.4
	}[doc_size];
        pdf.addImage(canvas.toDataURL("image/jpeg"),"JPEG",mar,mar,size,size);
        pdf.setFont(font,"normal");
        pdf.text(text,mar,size+mar+0.5);
	return pdf;
    },
    makeOrigami:async function(canvas,data,rl=false,ud=false,col_aut=false){return new Promise(function(resolve,reject){
	//準備
	var cubemap=new Array(6).fill();
        var cbmp=[];

	if(Array.isArray(data)){
	    for(let c in cubemap){(function(){
	        cubemap[c]=new Image();
	        let reader=new FileReader();
	        reader.onload=function(){cubemap[c].src=reader.result;}
	        cubemap[c].onload=function(){
                  cbmp[c]=document.createElement("canvas");
                  cbmp[c].width=300;cbmp[c].height=300;
                  const cv=cbmp[c].getContext("2d");
                  cv.save();
                  cv.scale(rl? -1:1,ud? -1:1);
                  cv.drawImage(cubemap[c],0,0,rl? -300:300,ud? -300:300);
                  cv.restore();
                  if(cbmp.length==6){
                    if(ud){[cbmp[0],cbmp[5]]=[cbmp[5],cbmp[0]];}
                    if(rl){[cbmp[2],cbmp[4]]=[cbmp[4],cbmp[2]];}
                    resolve([OrigamiCube.toOrigami(canvas,cbmp),[]]);
                  }
                };
	        reader.readAsDataURL(data[c]);
	    })();}
	}else{
	    var map_b=new Image();
	    var reader=new FileReader();
	    reader.onload=function(){map_b.src=reader.result;}
	    map_b.onload=function(){
              if(Math.round(map_b.width/map_b.height)==2){
                const canv=document.createElement("canvas");
                canv.width=1200;canv.height=600;
                const cv=canv.getContext("2d");
                cv.save();
                cv.scale(rl? -1:1,ud? -1:1);
                cv.drawImage(map_b,0,0,rl? -1200:1200,ud? -600:600);
                cv.restore();
                
                const map=new Image();
                map.onload=function(){
                  if(col_aut){
                    const ctx=canvas.getContext("2d");
                    const color=new ColorThief().getColor(map);
                    ctx.fillStyle=OrigamiCube.rgbTo16(color);
                    ctx.fillRect(0,0,canvas.width,canvas.height);
                    ctx.strokeRect(0,0,canvas.width,canvas.height);
                  }
                  resolve([OrigamiCube.toOrigami(canvas,OrigamiCube.toCubemap(canv)),new ColorThief().getPalette(map).map(OrigamiCube.rgbTo16)]);
                }
                map.src=canv.toDataURL();
              }else if(Math.round(map_b.width/map_b.height*3)==4){
                var cubemap=new Array(6).fill();
                let count=0;
	        for(let c in cubemap){
	          cubemap[c]=new Image();
	          const canv=document.createElement("canvas");
                  const cv=canv.getContext("2d");canv.width=canv.height=300;
                  const rect1=Math.round(map_b.width/4);
                  const [x,y]=[rect1*OrigamiCube.cbmp_st[c][0],rect1*OrigamiCube.cbmp_st[c][1]]
                  cv.drawImage(map_b,x,y,rect1,rect1,0,0,300,300);
	          cubemap[c].onload=function(){
                    count++;
                    if(count==6){resolve([OrigamiCube.toOrigami(canvas,cubemap),[]]);}
                  };
	          cubemap[c].src=canv.toDataURL();
	        }
              }else{alert("画像のサイズが適していません。");}
            }
	    reader.readAsDataURL(data);
	}
    });}
}
