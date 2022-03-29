import React, { createRef, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import htmlHelperService from "./../services/htmlHelperService";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import { commonService } from "../services/imports";
import { facsimButtonXY, landscapeDocumentWidthPoint, landscapeDocumentHeightPoint } from "../models/wrapData";

const submitXY = (event) => {
  var bounds = event.target.getBoundingClientRect();
  var left = bounds.left;
  var top = bounds.top;
  var x = event.pageX - left;
  var y = event.pageY - top;
  facsimButtonXY.X = x;
  facsimButtonXY.y = y;
};

const PDFViewer = (props) => {
  const [numPages, setNumPages] = useState(0);
  const [isPortrait, setIsPortrait] = useState(undefined);
  const A4 = 595;
  const landscapeDocHeight = 1.33;
  const docWidth = A4;

  const dragFacsimImgWidth = 90;
  const dragFacsimImgHeight = 31;
  ("facsimile logo native width = 260, height = 180");
  const itemsEls = useRef();
  const activeImgVisibleIndicator = createRef();
  let pages = [];
  const onDocumentLoadError = (e) => {
    props.onLoaded(e);
  };

  const setViewPort = (view) => {
    if(isPortrait !== undefined) return;
    const width = view[2];
    const height = view [3];

    if(width > height) {
      setIsPortrait(false);
      landscapeDocumentWidthPoint.point = width;
      landscapeDocumentWidthPoint.point = landscapeDocumentWidthPoint.point / A4;
    
      landscapeDocumentHeightPoint.point = landscapeDocHeight;
    } else {
      setIsPortrait(true);
      landscapeDocumentWidthPoint.point = 1;
      landscapeDocumentHeightPoint.point = 1;
    }
  }

  const onDocumentLoadSuccess = (params) => {
    const { numPages } = params;
   
    setNumPages(numPages);

    htmlHelperService
      .setIdleTimer(1000)
      .subscribe(() => {
        pages = itemsEls.current?.children;

        for (let x = 0; x < pages.length; x++) {
          pages[x].firstChild.addEventListener("dragover", (e) =>
            logCoordinates(e, x, numPages)
          );

          pages[x].firstChild.addEventListener("dragenter", (e) =>
            hideFacsimiles(e)
          );

          const el = document.createElement("img");
          el.width = dragFacsimImgWidth;
          el.height = dragFacsimImgHeight;
          el.draggable = true;
          el.style.display = "none";
          el.src = props.imgData;
          el.slassName = "dragableImage";
          el.onmousedown = submitXY;
          pages[x].appendChild(el);
        }
      })
      .unsubscribe();

    htmlHelperService
      .setIdleTimer(500)
      .subscribe(() => {
        props.onLoaded();
      })
      .unsubscribe();
  };

  const debouncedExec = commonService.debounce((e) => e(), 1000);

  const logCoordinates = (e, index, n) => {
    let buttonX = facsimButtonXY.X;
    let buttonY = facsimButtonXY.y;
    let Y = (e.layerY >= 0 ? e.layerY : e.offsetY) - buttonY;
    let X = e.layerX - buttonX;

    if (
      Y >= e.srcElement.clientHeight - dragFacsimImgHeight &&
      index + 1 === n
    ) {
      let el = pages[index].querySelector("img");
      el.style = `display: none;`;
      return;
    }

    if (X >= docWidth - dragFacsimImgWidth) {
      X = docWidth - dragFacsimImgWidth;
    }

    if (activeImgVisibleIndicator.current) {
      clearTimeout(activeImgVisibleIndicator.current);
    }

    if (e.layerX >= 0 && Y >= 0) {
      activeImgVisibleIndicator.current = setTimeout(() => {
        if (!props.isDragged) {
          let el = pages[index].querySelector("img");
          el.style = `display: block; position: absolute; left: ${X}px; top: ${Y}px;`;
        }
      }, 100);
    }

    debouncedExec(props.onSendPosition.bind(this, X * landscapeDocumentWidthPoint.point, Y * landscapeDocumentHeightPoint.point, index + 1));
  };

  const hideFacsimiles = () => {
    htmlHelperService
      .setIdleTimer(100)
      .subscribe(() => {
        for (let x = 0; x < pages.length; x++) {
          let el = pages[x].querySelector("img");
          if (el) {
            el.style = "display: none";
          }
        }
      })
      .unsubscribe();
  };

  useEffect(() => {
    return () => {
      for (let x = 0; x < pages.length; x++) {
        pages[x].firstChild.removeEventListener("dragover", logCoordinates);
        pages[x].firstChild.removeEventListener("dragenter", hideFacsimiles);
      }

      if (activeImgVisibleIndicator.current) {
        clearTimeout(activeImgVisibleIndicator.current);
      }
    };
  }, []);

  useEffect(() => {
    if (props.coords) {
      facsimButtonXY.X = props.coords.x;
      facsimButtonXY.y = props.coords.y;
    }

    return () => {
      facsimButtonXY.X = 0;
      facsimButtonXY.y = 0;
    }
  }, [props.coords]);

  return (
    <div
      style={{
        width: `${docWidth}px`,
        ...props.style,
      }}
      className="PDFContainer"
    >
      <Document
        inputRef={itemsEls}
        file={props.doc}
        pageIndex={1}
        renderMode={"canvas"}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
      >
        {numPages &&
          Array.apply(null, Array(numPages)).map((_, index) => {
            return (
              <Page
                className="pdfPage"
                pageNumber={index + 1}
                width={docWidth}
                key={index}
                onLoadSuccess={(e) => setViewPort(e.getViewport().viewBox)}
              />
            );
          })}
      </Document>
    </div>
  );
};

export default React.memo(PDFViewer);
