import React, { useRef, useState, useEffect, memo, createRef } from "react";
import { translateService } from "./../services/imports";
import { Scrollbars } from "react-custom-scrollbars";
import { LoadingButton } from "./../components/formcontrols/imports";
import PDFViewer from "./../components/PDFViewer";

const GetPdf = (props) => {
  const dragableRef = useRef();
  const scroller = useRef();
  const scrollDelay = useRef();
  const [pagesAreLoaded, setPagesAreLoaded] = useState(false);
  const [dataSubmiting, setDataSubmiting] = useState(false);
  const [isDragged, setIsDragged] = useState(false);
  const [{ buttonX, buttonY }, setButtonXY] = useState({
    buttonY: 0,
    buttonX: 0,
  });

  const [{ facsimX, facsimY, Pdfpage }, setPosition] = useState({
    facsimX: -1,
    facsimY: -1,
    Pdfpage: 1,
  });

  const getXY = (event) => {
    var bounds = dragableRef.current.getBoundingClientRect();
    var left = bounds.left;
    var top = bounds.top;
    var x = event.pageX - left;
    var y = event.pageY - top;

    setButtonXY({ buttonX: x, buttonY: y });
  };

  const getPostiotion = (x, y, i) => {
    setPosition({ facsimX: x, facsimY: y, Pdfpage: i });
  };

  const submitDataUp = () => {
    setDataSubmiting(true);
    props.onSubmitFacsimData({
      x: facsimX,
      y: facsimY,
      page: Pdfpage,
    });
  };

  useEffect(() => {
    setDataSubmiting(false);
  }, [props.hasFacsimileError]);

  const onBackCall = (e) => {
    setPagesAreLoaded(true);
  };

  const toggle = (value) => {
    setIsDragged(value);
  };

  const scrollDown = (direction = -1) => {
    if (scrollDelay.current) clearInterval(scrollDelay.current);
    scrollDelay.current = setInterval(() => {
      if (direction < 0) {
        scroller.current.scrollTop(scroller.current.getScrollTop() + 5);
        if (
          scroller.current.getScrollHeight() <=
          scroller.current.getValues().clientHeight +
            scroller.current.getValues().scrollTop
        ) {
          clearInterval(scrollDelay.current);
        }
      } else {
        scroller.current.scrollTop(scroller.current.getScrollTop() - 5);
        if (
          scroller.current.getValues().scrollTop <= 0
        ) {
          clearInterval(scrollDelay.current);
        }
      }
    }, 10);
  };

  const endScroll = () => {
    if (scrollDelay.current) clearInterval(scrollDelay.current);
    console.log("out");
  };

  useEffect(() => {
    dragableRef.current.addEventListener("mousedown", getXY);

    return () => {
      dragableRef.current.removeEventListener("mousedown", getXY);
    };
  }, []);

  return (
    <div className="pdfPageLay">
      <div className="modalheader">
        <span className="pdfPageTitle">
          {translateService.t("dashboard.putFacsimile")}
        </span>
        <span className="pdfPageTitleTwo">
          {translateService.t("dashboard.canDrag")}
        </span>

        <img
          src={props.imgData}
          width="90"
          height="31"
          draggable="true"
          ref={dragableRef}
          className="facsimDragImg"
          onMouseUp={() => toggle(false)}
          onMouseDown={() => toggle(true)}
        />
        <div
          className="scrollStartArea top"
          onDragEnter={scrollDown.bind(this, 1)}
           onDragLeave={endScroll}
          draggable={true}
        ></div>
      </div>
      <Scrollbars autoHide className="pdfScrollView" ref={scroller}>
        {!pagesAreLoaded && (
          <div className="pdfLoading">
            <img src="./assets/images/black-loading.svg" />
          </div>
        )}
        <PDFViewer
          onLoaded={onBackCall}
          doc={props.doc}
          onSendPosition={getPostiotion}
          isDragged={isDragged}
          imgData={props.imgData}
          coords={{ x: buttonX, y: buttonY }}
        />
      </Scrollbars>
      <div className="modalfooter">
        <div
          className="scrollStartArea"
          onDragEnter={scrollDown.bind(this, -1)}
          onDragLeave={endScroll}
          draggable={true}
        ></div>
        <div className="buttons">
          <LoadingButton
            className="button background-color-three color-white"
            onClick={() => props.onCloseFacsimile()}
          >
            {translateService.t("common.cancell")}
          </LoadingButton>

          <LoadingButton
            className="button background-color-two color-white"
            onClick={() => props.onValidateWithoutApostile()}
          >
            {translateService.t("dashboard.withoutApost")}
          </LoadingButton>

          <LoadingButton
            className="button background-color-two color-white"
            loading={dataSubmiting}
            onClick={submitDataUp}
          >
            {translateService.t("common.continue")}
          </LoadingButton>
        </div>
      </div>
    </div>
  );
};

export default memo(GetPdf);
