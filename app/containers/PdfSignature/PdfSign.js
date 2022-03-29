import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
import { Scrollbars } from "react-custom-scrollbars";
import translateService from "./../../services/translateService";
import "./pdf.css";

const PdfSign = ({ facsimile, pdfDocument, onSubmitFacsimData }) => {
  const [numPages, setNumPages] = useState(0);
  const [pagesContainerHeight, setPagesContainerHeight] = useState(0);
  const [pages, setPages] = useState([]);
  const canvasRef = useRef();
  const pagesContainerRef = useRef();
  const iconRef = useRef();
  const ctxRef = useRef();
  const pdf = useRef();

  const parentModalX = (window.innerWidth - pdf.current?.clientWidth) / 2;
  const parentModalY = ((window.innerHeight - pdf.current?.clientHeight) - 78) / 2; // 78 is modal footer height
  const facsimilePosition = {};
  const iconWidth = 90;
  const iconHeight = 31;
  const pageWidth = 595;
  const rects = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    isDragging: false,
  };
  let curPage = 0;
  let pos;
  let BB;
  // drag related variables
  let dragok = false;
  let startX = 0; /*from  w  w w .  d em o2 s. c o m*/
  let startY = 0;
  let offsetX;
  let offsetY;
  let WIDTH = 0;
  let HEIGHT = 0;

  useEffect(() => {
    ctxRef.current = canvasRef.current.getContext("2d");
    BB = canvasRef.current.getBoundingClientRect();
    offsetX = BB.left;
    offsetY = BB.top;
    WIDTH = canvasRef.current.width;
    HEIGHT = canvasRef.current.height;
  }, [numPages, pagesContainerHeight, pages]);

  function allowDrop(ev) {
    ev.preventDefault();
  }

  function get_pos(ev) {
    pos = [ev.pageX, ev.pageY];
  }

  function drop(ev) {
    ev.preventDefault();
    let img = iconRef.current;
    let dx = pos[0] - img.offsetLeft;
    let dy = pos[1] - img.offsetTop;

    rects.x = (ev.nativeEvent.offsetX - dx) + parentModalX;
    rects.y = (ev.nativeEvent.offsetY - dy) + parentModalY;

    console.log(ev.nativeEvent, rects)
    rects.width = iconWidth;
    rects.height = iconHeight;
    rects.isDragging = false;
    facsimilePosition.x = rects.x;
    facsimilePosition.y = rects.y;
    setCurPage();
    draw();
  }

  // listen for mouse events
  useEffect(() => {
    canvasRef.current.onmousedown = myDown;
    canvasRef.current.onmouseup = myUp;
    canvasRef.current.onmousemove = myMove;
  }, [numPages, pagesContainerHeight]);

  // draw a single rect
  function rect(x, y, w, h) {
    ctxRef.current.beginPath();
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x + iconWidth > pageWidth) x = pageWidth - iconWidth;
    if (y + iconHeight > pagesContainerHeight)
      y = pagesContainerHeight - iconHeight;
    ctxRef.current.rect(x, y, w, h);
    ctxRef.current.closePath();
    let base_image = new Image();
    base_image.src = facsimile;
    // base_image.width = w;
    // base_image.height = h;
    ctxRef.current.drawImage(base_image, x, y, w, h);
  }

  // clear the canvas
  function clear() {
    ctxRef.current.clearRect(0, 0, WIDTH, HEIGHT);
  }

  // redraw the scene
  function draw() {
    clear();
    // redraw each rect in the rects[] array

    rect(rects.x, rects.y, rects.width, rects.height);
  }

  // handle mousedown events
  function myDown(e) {
    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();
    // get the current mouse position
    //@ts-ignore
    let mx = parseInt(e.clientX - offsetX);
    //@ts-ignore
    let my = parseInt(e.clientY - offsetY);
    // test each rect to see if mouse is inside
    dragok = false;

    if (e.offsetY > rects.y && e.offsetY < rects.y + rects.height) {
      if (e.offsetX > rects.x && e.offsetX < rects.x + rects.width) {
        dragok = true;
        rects.isDragging = true;
      }
    }
    // save the current mouse position
    startX = mx;
    startY = my;
  }

  // handle mouseup events
  function myUp(e) {
    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();
    if (rects.x < 0) rects.x = 0;
    if (rects.y < 0) rects.y = 0;
    if (rects.x + iconWidth > pageWidth) rects.x = pageWidth - iconWidth;
    if (rects.y + iconHeight > pagesContainerHeight)
      rects.y = pagesContainerHeight - iconHeight;

    if (rects.isDragging) {
      facsimilePosition.x = rects.x;
      facsimilePosition.y = rects.y;
      setCurPage();
    }
    // clear all the dragging flags
    dragok = false;
    rects.isDragging = false;
  }

  // handle mouse moves
  function myMove(e) {
    // if we're dragging anything...
    if (dragok) {
      // tell the browser we're handling this mouse event
      e.preventDefault();
      e.stopPropagation();
      // get the current mouse position
      //@ts-ignore
      let mx = parseInt(e.clientX - offsetX);
      //@ts-ignore
      let my = parseInt(e.clientY - offsetY);
      // calculate the distance the mouse has moved
      // since the last mousemove
      let dx = mx - startX;
      let dy = my - startY;
      // move each rect that isDragging
      // by the distance the mouse has moved
      // since the last mousemove

      if (rects.isDragging) {
        rects.x += dx;
        rects.y += dy;
      }

      // console.log(rects.x, rects.y);
      if (rects.x < 0) rects.x = 0;
      if (rects.y < 0) rects.y = 0;
      if (rects.x + iconWidth > pageWidth) rects.x = pageWidth - iconWidth;
      if (rects.y + iconHeight > pagesContainerHeight)
        rects.y = pagesContainerHeight - iconHeight;
      // redraw the scene with the new rect positions
      draw();
      // reset the starting mouse position for the next mousemove
      startX = mx;
      startY = my;
    }
  }

  const onDocumentLoadSuccess = (params) => {
    const { numPages } = params;
    setNumPages(numPages);
  };

  useEffect(() => {
    setTimeout(() => {
      let PCH = 0;
      if (pagesContainerRef.current?.getBoundingClientRect()) {
        PCH =
          pagesContainerHeight +
          pagesContainerRef.current.getBoundingClientRect().height;
      }
      setPagesContainerHeight(PCH);
    }, 100);
  }, [numPages]);

  const onDocumentLoadError = (e) => {
    console.log(e);
  };

  const setViewPort = (view, i, localheight, localWidth) => {
    setPages((prevPages) => {
      let width = view[2];
      let height = view[3];
      let index = i;
      return [
        ...prevPages,
        {
          width,
          height,
          index,
          localHeight: Math.floor(localheight),
          localWidth: Math.floor(localWidth),
        },
      ];
    });
  };

  const setCurPage = () => {
    if (facsimilePosition) {
      let height = 0;
      for (let page of pages) {
        height += page.localHeight;
        curPage = page.index;
        if (facsimilePosition.y <= height) {
          return submit();
        }
      }
    }
  };

  const submit = () => {
    console.log({ data }, pages);
    const xpoint =
      facsimilePosition.x * (pages[curPage].width / pages[curPage].localWidth);
    let upPagesHeight = 0;

    for (let p = 0; p < pages.length; p++) {
      if (p < curPage) {
        upPagesHeight += pages[p].localHeight;
      }
    }

    const ypoint =
      (facsimilePosition.y - upPagesHeight) *
      (pages[curPage].height / pages[curPage].localHeight);
    const data = {
      x: xpoint,
      y: ypoint,
      page: curPage + 1,
    };

    onSubmitFacsimData(data);
  };

  return (
    <div className="pdf" ref={pdf}>
      <div className="pdfheader">
        <span className="pdfPageTitle">
          {translateService.t("dashboard.putFacsimile")}
        </span>
        <span className="pdfPageTitleTwo">
          {translateService.t("dashboard.canDrag")}
        </span>

        <img
          className="facsimImg"
          ref={iconRef}
          src={facsimile}
          draggable="true"
          onMouseDown={get_pos}
          width={iconWidth}
          height={iconHeight}
        />
      </div>
      {/* <button onClick={submit}>submit data</button> */}

      <div className="pdfContainer">
        <Scrollbars autoHide className="pdfScrollView">
          <Document
            file={pdfDocument}
            pageIndex={1}
            renderMode={"canvas"}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          >
            <div
              ref={pagesContainerRef}
              style={{ width: `${pageWidth}px` }}
              className="pdfContent"
            >
              {numPages &&
                Array.apply(null, Array(numPages)).map((_, index) => {
                  return (
                    <Page
                      key={index}
                      className="_pdfp"
                      pageNumber={index + 1}
                      width={pageWidth}
                      onLoadSuccess={(e) =>
                        setViewPort(
                          e.getViewport().viewBox,
                          index,
                          e.height,
                          e.width
                        )
                      }
                    />
                  );
                })}
            </div>
          </Document>
          <canvas
            style={{ left: `calc(50% - ${pageWidth / 2}px)` }}
            className="drawerCanvas"
            ref={canvasRef}
            width={pageWidth}
            height={pagesContainerHeight}
            onDrop={drop}
            onDragOver={allowDrop}
          ></canvas>
        </Scrollbars>
      </div>
    </div>
  );
};

export default React.memo(PdfSign);
