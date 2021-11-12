import * as React from "react";
import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { FullOfficer } from "state/dispatchState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { FormRow } from "components/form/FormRow";
import { CropImageModal } from "components/modal/CropImageModal";

interface Props {
  officer: FullOfficer | null;
  onCreate?: (officer: FullOfficer) => void;
  onUpdate?: (old: FullOfficer, newO: FullOfficer) => void;
  onClose?: () => void;
}

export const ManageOfficerModal = ({ officer, onClose, onUpdate, onCreate }: Props) => {
  const [image, setImage] = React.useState<File | null>(null);
  const { openModal, isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { citizens } = useCitizen();

  const { state, execute } = useFetch();
  const { department, division } = useValues();

  function handleClose() {
    closeModal(ModalIds.ManageOfficer);
    onClose?.();
  }

  function onCropSuccess(url: Blob, filename: string) {
    setImage(new File([url], filename, { type: url.type }));
    closeModal(ModalIds.CropImageModal);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = new FormData();

    if (image && image.size && image.name) {
      if (!allowedFileExtensions.includes(image.type as AllowedFileExtension)) {
        helpers.setFieldError("image", `Only ${allowedFileExtensions.join(", ")} are supported`);
        return;
      }

      fd.set("image", image, image.name);
    }

    let officerId;
    if (officer) {
      const { json } = await execute(`/leo/${officer.id}`, {
        method: "PUT",
        data: values,
      });

      officerId = officer.id;

      if (json.id) {
        onUpdate?.(officer, json);
      }
    } else {
      const { json } = await execute("/leo", {
        method: "POST",
        data: values,
      });

      officerId = json.id;

      if (json.id) {
        onCreate?.(json);
      }
    }

    if (image && image.size && image.name) {
      await execute(`/leo/image/${officerId}`, {
        method: "POST",
        data: fd,
      });
    }

    if (officerId) {
      closeModal(ModalIds.ManageOfficer);
    }
  }

  const validate = handleValidate(CREATE_OFFICER_SCHEMA);
  const INITIAL_VALUES = {
    department: officer?.departmentId ?? "",
    rank: officer?.rankId ?? "",
    callsign: officer?.callsign ?? "",
    callsign2: officer?.callsign2 ?? "",
    division: officer?.divisionId ?? "",
    badgeNumber: officer?.badgeNumber ?? "",
    citizenId: officer?.citizenId ?? "",
    image: undefined,
  };

  return (
    <Modal
      title={officer ? t("editOfficer") : t("createOfficer")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageOfficer)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, handleSubmit, setFieldValue, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField label={t("image")}>
              <div className="flex">
                <Input
                  style={{ width: "95%", marginRight: "0.5em" }}
                  onChange={(e) => {
                    handleChange(e);
                    setImage(e.target.files?.[0] ?? null);
                  }}
                  type="file"
                  name="image"
                  value={values.image ?? ""}
                />
                <Button
                  className="mr-2"
                  type="button"
                  onClick={() => {
                    openModal(ModalIds.CropImageModal);
                  }}
                >
                  Crop
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    setFieldValue("image", "");
                  }}
                >
                  {common("delete")}
                </Button>
              </div>
              <Error>{errors.image}</Error>
            </FormField>

            <FormField label={t("citizen")}>
              <Select
                isClearable
                value={values.citizenId}
                hasError={!!errors.citizenId}
                name="citizenId"
                onChange={handleChange}
                values={citizens.map((value) => ({
                  label: `${value.name} ${value.surname}`,
                  value: value.id,
                }))}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

            <FormField label={t("badgeNumber")}>
              <Input
                type="number"
                value={values.badgeNumber}
                hasError={!!errors.badgeNumber}
                id="badgeNumber"
                onChange={(e) =>
                  handleChange({
                    ...e,
                    target: {
                      ...e.target,
                      id: "badgeNumber",
                      value: e.target.valueAsNumber,
                    },
                  })
                }
              />
              <Error>{errors.badgeNumber}</Error>
            </FormField>

            <FormRow>
              <FormField label={"Callsign Symbol 1"}>
                <Input
                  value={values.callsign}
                  hasError={!!errors.callsign}
                  id="callsign"
                  onChange={handleChange}
                />
                <Error>{errors.callsign}</Error>
              </FormField>

              <FormField label={"Callsign Symbol 2"}>
                <Input
                  value={values.callsign2}
                  hasError={!!errors.callsign2}
                  id="callsign2"
                  onChange={handleChange}
                />
                <Error>{errors.callsign2}</Error>
              </FormField>
            </FormRow>

            <FormField label={t("department")}>
              <Select
                value={values.department}
                hasError={!!errors.department}
                name="department"
                onChange={handleChange}
                values={department.values
                  .filter((v) => v.type === "LEO")
                  .map((value) => ({
                    label: value.value.value,
                    value: value.id,
                  }))}
              />
              <Error>{errors.department}</Error>
            </FormField>

            <FormField label={t("division")}>
              <Select
                value={values.division}
                hasError={!!errors.division}
                name="division"
                onChange={handleChange}
                values={division.values
                  .filter((v) => (values.department ? v.departmentId === values.department : true))
                  .map((value) => ({
                    label: value.value.value,
                    value: value.id,
                  }))}
              />
              <Error>{errors.division}</Error>
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {officer ? common("save") : common("create")}
              </Button>
            </footer>

            <CropImageModal
              isOpen={isOpen(ModalIds.CropImageModal)}
              onClose={() => closeModal(ModalIds.CropImageModal)}
              image={image}
              onSuccess={onCropSuccess}
            />
          </form>
        )}
      </Formik>
    </Modal>
  );
};
