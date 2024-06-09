window.onload=function(){
      var canvas=document.getElementById("canvas");
      var form=document.OrigamiCubeMaker;
      var files=form.img.files;
      var cvdt=[];var fls=[];
      
      var download={};
      download.down=document.getElementById("download");
      for(ele of download.down.children){download[ele.id]=ele;}
      
      //キャンバスの準備
      var cv=canvas.getContext("2d");
      cv.reset=function(){
        this.fillStyle=form.color.value;
        this.fillRect(0,0,canvas.width,canvas.height);
        this.strokeRect(0,0,canvas.width,canvas.height);
      }
      cv.clrb=function(){
        let im=cv.getImageData(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < im.data.length; i=i+4) {
          im.data[i]   = 255 - im.data[i];    //R
          im.data[i+1] = 255 - im.data[i+1];  //G
          im.data[i+2] = 255 - im.data[i+2];  //B
        }
        cv.putImageData(im, 0, 0);
      };
      cv.reset();
      
      const faces={
          japanese:["上","前","右","後","左","下"],
          english:["top","front","right","back","left","buttom"]
      };

      form.rl_rev.onchange=form.ud_rev.onchange=form.cl_rev.onchange=function(e){
        if(e.target.checked){e.target.parentNode.classList.remove("off");}
        else{e.target.parentNode.classList.add("off");}
        if(e.target==form.cl_rev){cv.clrb();}
        else{form.img.onchange({target:form.img});}
      };

      function after([canvas,cols]){
        if(form.cl_rev.checked){cv.clrb();}
        var name=(files.length==1)? files[0].name.split(".")[0]:"result";
        
        download.img.href=canvas.toDataURL(files[0].type);
        download.img.ondragstart=e=>{e.dataTransfer.setData("DownloadURL",files[0].type+":"+name+":"+e.target.href)};
        download.down.style.display="";

        while (download.cols.firstChild){download.cols.removeChild(download.cols.firstChild);}
        for(col of cols){
          let ele=download.cols.appendChild(document.createElement("option"));
          ele.value=ele.textContent=col;
        }
      }

      form.color.onchange=()=>{form.img.onchange({target:form.img},false);}
      form.paste.onclick=async(e)=>{
        const map=await navigator.clipboard.read().then(function(m){return m[0].getType('image/png');});
        map.name="result.jpg"
        form.img.onchange({target:{files:[map]}});
      };
      document.onkeydown=function(e){
        if(e.ctrlKey){
          if(e.code=="KeyV"){(async(e)=>{
            const map=await navigator.clipboard.read().then(function(m){return m[0].getType('image/png');});
            map.name="result.jpg"
            form.img.onchange({target:{files:[map]}});
          })(e);}else if(e.code=="KeyF"){
            e.preventDefault();
            form.img.click();
          }else if(e.code=="KeyC"||e.code=="KeyX"){canvas.toBlob(async (blob) => {
            await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
            if(e.code=="KeyX"){cv.reset();}
            alert('クリップボードにコピーしました。');
          });}
        }else if(e.code=="Enter"){
          e.preventDefault();
          form.img.onchange({target:form.img});
        }
      };
      document.ondragover=e=>{e.preventDefault();};
      document.getElementById("flsl").ondragover=e=>{e.target.classList.add("hover");};
      document.getElementById("flsl").ondragleave=e=>{e.target.classList.remove("hover");};
      document.ondrop=e=>{
        e.preventDefault();
        e.target.classList.remove("hover");
        form.img.onchange({target:e.dataTransfer});
      };

      const menu_dia=function(files,faces){return new Promise(function(resolve,reject){
        if(fls.length==files.length){resolve(fls);}else{
        let menu=document.body.appendChild(document.createElement("form"));
        with(menu.style){
          width="300px";
          height="450px";
          border="1px solid #aaa";
          boxShadow="2px 2px 4px #888";
          backgroundColor="#fff";
          padding="1em";
          margin="auto";
          zIndex="10";
          
          //中央寄せ
          position="fixed";
          top=bottom=left=right="0";
          margin="auto";
        }
        menu.face=menu.appendChild(document.createElement("span"));
        menu.face.textContent=faces[0];
        menu.appendChild(document.createTextNode("の面の画像を選択してください"));
        menu.add=function(text){
          var node=menu.appendChild(document.createElement("label"));
          with(node.style){
            display="block";
            borderTop=borderBottom="1px solid #aaa";
            borderCollapse="collapse";
            margin="0";
            padding="0.5em";
          }
          var btn=node.appendChild(document.createElement("input"));
          btn.type="radio";
          btn.name="files";
          btn.value=text;
          btn.style.display="none";
          node.appendChild(document.createTextNode(text));
          return btn;
        }
        
        let map=[];
        map.add=function(ele){
          map.push(files[ele.value]);
          ele.parentNode.remove();
        };
        
        for(file of files){
          files[file.name]=file;
          menu.add(file.name).onchange=function(e){
            map.add(e.target);
            if(!menu.files.length){
              map.add(menu.files);
              menu.remove();
              if(map.length<faces.lengh){alert("画像の一部が見当たりませんでした。");}
              else{fls=map;resolve(map);}
            }else{menu.face.textContent=faces[faces.indexOf(menu.face.textContent)+1];}
          }
        }}
      });}
      form.img.onchange=function(e,col_aut=true){
        cvdt=[];
        download.down.style.display="none";
        files=e.target.files;
        cv.reset();
        if(files.length==6){
          menu_dia(files,OrigamiCube.face).then(async(files)=>{
            return OrigamiCube.makeOrigami(canvas,files,form.rl_rev.checked,form.ud_rev.checked);})
            .then(after);
        }else if(files.length==1){
            fls=[];
            OrigamiCube.makeOrigami(canvas,files[0],form.rl_rev.checked,form.ud_rev.checked,col_aut).then(after);
          }else{
            var zip=new JSZip();
            (async function(){
              if(files.length==2){
                const maps=await menu_dia(files,["表","裏"]);
                let [result,cols]=await OrigamiCube.makeOrigami(canvas,maps[0],false,false,col_aut);
                
                cvdt.push(result.getContext("2d").getImageData(0,0,canvas.width,canvas.height));
                zip.file(maps[0].name,result.toDataURL(maps[0].type).split(",")[1],{base64:true});
                [result,cols]=await OrigamiCube.makeOrigami(canvas,maps[1],form.rl_rev.checked,form.ud_rev.checked,col_aut);
                cvdt.push(result.getContext("2d").getImageData(0,0,canvas.width,canvas.height));
                zip.file(maps[1].name,result.toDataURL(maps[1].type).split(",")[1],{base64:true});
              }else{fls=[];for(file of files){
                  [result,cols]=await OrigamiCube.makeOrigami(canvas,file,form.rl_rev.checked,form.ud_rev.checked,col_aut);
                  cvdt.push(result.getContext("2d").getImageData(0,0,canvas.width,canvas.height));
                  zip.file(file.name,result.toDataURL(file.type).split(",")[1],{base64:true});
              }}
              
              download.img.href=URL.createObjectURL(await zip.generateAsync({type:"blob"}));
              download.img.download="result.zip";
              download.down.style.display="";
          })();
        }
      }
      document.getElementById("slbt").onchange=async e=>{if(e.target.value){
        if(e.target.value=="docx"){
          function makeImgObj(cv){
            return new docx.ImageRun({
              data: OrigamiCube.cvToBuf(cv),
              transformation: {
                width:756,
                height:756
              },
            });
          }
          if(cvdt.length==0){var child=[new docx.Paragraph({children:[makeImgObj(canvas)]})];}
          else{
            var child=[];
            for(dt of cvdt){
              canvas.getContext("2d").putImageData(dt,0,0);
              child.push(new docx.Paragraph({children:[makeImgObj(canvas)]}));
            }
          }
         
          const doc = new docx.Document({
            sections: [
              {
                properties: {
                  page: {
                    margin: {
                      top:docx.convertMillimetersToTwip (5),
                      bottom:docx.convertMillimetersToTwip(5),
                      left:docx.convertMillimetersToTwip (5),
                      right:docx.convertMillimetersToTwip (5)
                    }
                  }
                },
                children:child
              }
          ]});
          docx.Packer.toBlob(doc).then(blob => {
            const a = document.createElement("a");
            a.src = URL.createObjectURL(blob);
            a.download = "image.jpg"
            window.open(a.src);
            URL.revokeObjectURL(a.src);
          });
        }else{
          let text=prompt("クレジット表記(任意)");
          text=text? text:"";
          let pdf=new jspdf.jsPDF("p","cm",e.target.value,true);
          if(cvdt.length==0){
            pdf=await OrigamiCube.toPDF(canvas,e.target.value,text,OrigamiCube.makePDF(e.target.value));
          }else{
            for(dt of cvdt){
              pdf.addPage();
              canvas.getContext("2d").putImageData(dt,0,0);
              await OrigamiCube.toPDF(canvas,e.target.value,text,pdf);
            }
            pdf.deletePage(1);
          }
          window.open(pdf.output("datauristring"));
        }
        e.target.value="";
      }}
}