import React, { useEffect, useRef, createRef, useState, useMemo } from "react";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { Scrollbars } from "react-custom-scrollbars";
import {
  translateService,
  mediaService,
  htmlHelperService,
  stateService
} from "./../services/imports";
import {
  createValidationContext,
  Input,
  LoadingButton,
  FieldValidation,
} from "./../components/formcontrols/imports";
import GetPdf from "../containers/GetPdf";
import PdfSign from "../containers/PdfSignature/PdfSign";
import { stateEvents } from "../models/states";

const FacsimileCard = (props) => {
  const canvasRef = createRef();
  const [fontInitialize, setFontInitialized] = useState(false);
  const fonts = {
    ka: [
      "mzeqala-regular",
      "gl-erekles-stamba-regular",
      "dm-niko-nikoladze",
      "sylfaen",
    ],
    en: [
      "AlexBrush-Regular",
      "Miama",
      "mzeqala-regular",
      "gl-erekles-stamba-regular",
    ],
  };

  const getData = () => {
    let data = canvasRef.current?.toDataURL();
    if (data) props.onGetData(data, props.index);
  };

  useEffect(() => {
    htmlHelperService
      .setIdleTimer(500)
      .subscribe(() => {
        setFontInitialized(true);
      })
      .unsubscribe();
  }, []);

  useEffect(() => {
    if (fontInitialize && props.index === 1) {
      htmlHelperService
        .setIdleTimer(500)
        .subscribe(() => {
          getData();
        })
        .unsubscribe();
    }
  }, [fontInitialize, props.text]);

  useEffect(() => {
    let canvas = canvasRef.current;
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let base_image = new Image();

    base_image.onload = function () {
      ctx.drawImage(base_image, 0, 0);
      ctx.font = `22px ${fonts[props.locale][props.fontType]}`;
      ctx.fillStyle = "#18181D";
      ctx.textAlign = "center";
      ctx.fillText(props.text, canvas.width / 2, 44);
    };
    base_image.src = "./../../../assets/images/facsimbg.svg";
  }, [props.text, fontInitialize]);

  return (
    <div className={`facsimCard ${props.active && "active"}`} onClick={getData}>
      <canvas
        ref={canvasRef}
        className="facsimCanvas"
        width="260"
        height="80"
      ></canvas>
    </div>
  );
};

const FacsimileEditor = (props) => {
  const [facsimData, setFacsimData] = useState();
  const assignerName = useRef();
  const assignerNameValidation = useRef();
  const [assignerNameValue, setAssignerNameValue] = useState();
  const [facsimileUploadProcessing, setFacsimileUploadProcessing] =
    useState(false);
  const SHTAPM_TYPES = [{ type: 1 }, { type: 2 }, { type: 3 }, { type: 4 }];

  const updateErrorInfo = async (e) => {
    !e.target.value && e.target.classList.add("tooltip-error");
  };

  const callBeforeClosing = () => {
    setAssignerNameValue("");
    props.onClosed();
  };

  const facsimileSetApos = () => {
    let anvv = assignerNameValidation.current
      .removeCustomErrors()
      .setDirty()
      .isValid();

    if (!anvv) {
      return;
    }
    setFacsimileUploadProcessing(true);

    mediaService.uploadFacsimileFile(props.facsimData).subscribe({
      next: (Response) => {
        if (Response.success) {
          props.sendFacsimData(Response.data?.value);
          setFacsimileUploadProcessing(false);
        }
      },
      error: (error) => {
        if(error.response.status === 401) {
          stateService.event(stateEvents.logouted, true);
        }
        setFacsimileUploadProcessing(false);
      },
    });
  };

  useEffect(() => {
    assignerNameValidation.current = createValidationContext();
  }, []);

  return (
    <Modal
      isOpen={props.isVisible}
      onClosed={callBeforeClosing}
      fade={true}
      toggle={props.onToggle}
      contentClassName={`modal-content noheight name-assign-modal ${
        props.signatureProcessStep === 2 && "stepTwo"
      } ${
        props.signatureProcessStep === 1 && "inFacsimCreation"
      }`}
    >
      <ModalHeader className={`${props.isEditing && 'facsimileEditModalHeader'}`}>
      {props.isEditing && (
          <div className="currentFacsimile">
            <span className="title">
              {translateService.t("dashboard.currentFacsimileTitle")}
            </span>
            <img
              src={props.currentFacsimData}
              width="260"
              height="80"
              className="facsimImg"
            />
          </div>
        )}
        <span>
          &nbsp;
          <span onClick={props.onToggle} className="clickable">
            <img src="../../assets/images/close32.svg" />
          </span>
        </span>
      </ModalHeader>
      <ModalBody>
        
        {props.signatureProcessStep === 1 && (
          // <Scrollbars autoHide className="facsimileScrollVIew">
            <div className="fontModalContent">
              <div className="fontModalTitle">
                {translateService.t(`dashboard.facsimileBlockTitle`)}
              </div>
              <div
                className="input-item assignerInput"
              >
                <FieldValidation
                  name="assignerName"
                  className="validation-register"
                  rule="required"
                  validation={assignerNameValidation.current}
                  for={assignerName.current}
                />
                <div className={`assign ${assignerNameValue ? "active" : ""}`}>
                  <Input
                    name="assignerName"
                    type="text"
                    placeholder={translateService.t("dashboard.namelname")}
                    spellCheck="false"
                    autoComplete="off"
                    value={assignerNameValue || ""}
                    rules={[{ name: "required" }]}
                    validation={assignerNameValidation.current}
                    maxLength={31}
                    onChange={(e) => {
                      setAssignerNameValue(e.target.value);
                    }}
                    ref={assignerName.current}
                    onFocus={(e) => updateErrorInfo(e)}
                  />
                  {true && <button className="emtyLink"></button>}
                </div>
              </div>

              <div
                className="fontModalTitle fontModalChildTitle"
              >
                {translateService.t(`dashboard.choosefacsimile`)}
              </div>

              <div className="facsimContainer">
                {!props.faximCardInitialized && (
                  <div className="pdfLoading">
                    <img src="./assets/images/black-loading.svg" />
                  </div>
                )}
                {SHTAPM_TYPES.map((s) => (
                  <FacsimileCard
                    text={
                      assignerNameValue ||
                      translateService.t("dashboard.namelname")
                    }
                    active={props.activeCardIndex === s.type}
                    key={s.type}
                    fontType={s.type - 1}
                    index={s.type}
                    locale={props.currentLang}
                    onGetData={(data, index) =>
                      props.onSetFacsimData(data, index)
                    }
                  />
                ))}
              </div>
              <div className={`buttons ${props.isEditing && "twoItem"}`}>
                <LoadingButton
                  className="button background-color-three color-white"
                  onClick={props.onToggle}
                >
                  {translateService.t("common.cancell")}
                </LoadingButton>

                {!props.isEditing && (
                  <LoadingButton
                    className="button background-color-two color-white"
                    onClick={props.OnValidateWithoutApostile}
                  >
                    {translateService.t("dashboard.withoutApost")}
                  </LoadingButton>
                )}

                <LoadingButton
                  className="button background-color-two color-white"
                  loading={facsimileUploadProcessing}
                  onClick={facsimileSetApos}
                >
                  {translateService.t(
                    `common.${props.isEditing ? "submit" : "continue"}`
                  )}
                </LoadingButton>
              </div>
            </div>
          // </Scrollbars>
        )}
        {props.signatureProcessStep === 2 && !props.isEditing && <>
          <PdfSign facsimile={props.facsimData || props.facsimilePath} pdfDocument={props.docPath} onSubmitFacsimData={setFacsimData} />
          {/* // <GetPdf
          //   imgData={props.facsimData || props.facsimilePath}
          //   doc={props.docPath}
          //   onValidateWithoutApostile={props.OnValidateWithoutApostile}
          //   onCloseFacsimile={props.onToggle}
          //   onSubmitFacsimData={props.onSubmitFacsimData}
          //   hasFacsimileError={props.hasFacsimileError} */}
   
          </>
        }
        <ModalFooter>
        <div className="modalfooter">

<div className="buttons">
  <LoadingButton
    className="button background-color-three color-white"
    onClick={props.onToggle}
  >
    {translateService.t("common.cancell")}
  </LoadingButton>

  <LoadingButton
    className="button background-color-two color-white"
    onClick={props.OnValidateWithoutApostile}
  >
    {translateService.t("dashboard.withoutApost")}
  </LoadingButton>

  <LoadingButton
    className="button background-color-two color-white"
    loading={props.isLoading}
     onClick={() => props.onSubmitFacsimData(facsimData)}
  >
    {translateService.t("common.continue")}
  </LoadingButton>
</div>
</div>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
};

export default FacsimileEditor;
