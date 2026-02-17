import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { SettingsExport } from "@/components/settings/settings-export";

describe("SettingsExport", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let clickSpy: jest.SpyInstance;

  beforeEach(() => {
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    URL.createObjectURL = jest.fn().mockReturnValue("blob:mock-url");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    clickSpy.mockRestore();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("downloads CSV and shows success toast", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="cadie-links-active-test.csv"',
      }),
      blob: async () => new Blob(["id,title\r\n1,Example\r\n"], { type: "text/csv" }),
    });

    render(<SettingsExport />);

    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/exports/links/csv", {
        method: "GET",
      });
    });

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
      expect(toast.success).toHaveBeenCalledWith("CSV export downloaded");
    });
  });

  it("shows error toast when export fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({
        "content-type": "application/json",
      }),
      json: async () => ({ error: "Export failed" }),
    });

    render(<SettingsExport />);

    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Export failed");
    });
  });
});
