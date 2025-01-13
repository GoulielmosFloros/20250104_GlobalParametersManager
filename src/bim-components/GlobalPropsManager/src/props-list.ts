import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import { GlobalPropertiesManager } from "..";

interface GlobalPropsListState {
  components: OBC.Components;
}

// This is the template function that defines how the list will behave and look like
const listTemplate: BUI.StatefullComponent<GlobalPropsListState> = (state) => {
  const { components } = state;
  const globalProps = components.get(GlobalPropertiesManager);

  const onCreated = (table?: Element) => {
    if (!(table instanceof BUI.Table)) return;
    // When the table is created, its data is populated.
    // In this case, we map the list of global properties to convert them
    // in the structure need by the bim-table component.
    // To know more about the table structure, take a look at the resources in the
    // guide.
    table.data = [...globalProps.list].map(({ name, type }) => {
      return { data: { Name: name, Type: type } };
    });
  };

  return BUI.html`<bim-table ${BUI.ref(onCreated)} headers-hidden no-indentation selectable-rows></bim-table>`;
};

// This is the factory function that creates the table based on the template
// defined above.
export const globalPropsList = (state: GlobalPropsListState) => {
  const component = BUI.Component.create<BUI.Table, GlobalPropsListState>(
    listTemplate,
    state,
  );

  return component;
};
