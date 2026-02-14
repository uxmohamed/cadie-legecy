import { fireEvent, render, screen } from "@testing-library/react";
import { InlineAddItem } from "@/components/link-list/inline-add-item";

describe("InlineAddItem", () => {
  it("submits when Enter is pressed with content", async () => {
    const onSubmit = jest.fn();
    const onChange = jest.fn();

    render(
      <InlineAddItem
        value="#234141"
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText("Enter a link, color, or image URL");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit when Enter is pressed with empty content", async () => {
    const onSubmit = jest.fn();

    render(
      <InlineAddItem
        value="   "
        onChange={jest.fn()}
        onSubmit={onSubmit}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText("Enter a link, color, or image URL");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
