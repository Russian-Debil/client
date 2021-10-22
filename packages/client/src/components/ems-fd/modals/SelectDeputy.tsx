import { SELECT_DEPUTY_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { useAuth } from "context/AuthContext";
import { StatusEnum } from "types/prisma";
import { useEmsFdState } from "state/emsFdState";

export const SelectDeputyModal = () => {
  const { deputies, setActiveDeputy } = useEmsFdState();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Ems");

  const { cad } = useAuth();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute(`/ems-fd/${values.deputy}/status`, {
      method: "PUT",
      data: {
        ...values,
        status: StatusEnum.ON_DUTY,
        status2: cad?.miscCadSettings.onDutyCode ?? "10-8",
      },
    });

    if (json.id) {
      closeModal(ModalIds.SelectDeputy);
      setActiveDeputy(json);
    }
  }

  const validate = handleValidate(SELECT_DEPUTY_SCHEMA);
  const INITIAL_VALUES = {
    deputy: "",
  };

  return (
    <Modal
      title={t("selectDeputy")}
      onClose={() => closeModal(ModalIds.SelectDeputy)}
      isOpen={isOpen(ModalIds.SelectDeputy)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("deputy")}>
              <Select
                value={values.deputy}
                hasError={!!errors.deputy}
                name="deputy"
                onChange={handleChange}
                isClearable
                values={deputies.map((officer) => ({
                  label: `${officer.name} (${officer.department?.value})`,
                  value: officer.id,
                }))}
              />
              <Error>{errors.deputy}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.SelectDeputy)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};