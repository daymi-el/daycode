import { describe, expect, it } from "vitest";
import { Schema } from "effect";

import { ClientSettingsSchema, DEFAULT_CLIENT_SETTINGS } from "./settings";

const decodeClientSettings = Schema.decodeUnknownSync(ClientSettingsSchema);

describe("ClientSettingsSchema", () => {
  it("defaults coming-soon model options to hidden when decoding older payloads", () => {
    expect(
      decodeClientSettings({
        confirmThreadArchive: true,
        confirmThreadDelete: false,
        diffWordWrap: true,
        sidebarSide: "right",
        sidebarProjectSortOrder: "manual",
        sidebarThreadSortOrder: "created_at",
        timestampFormat: "24-hour",
      }),
    ).toEqual({
      confirmThreadArchive: true,
      confirmThreadDelete: false,
      diffWordWrap: true,
      showComingSoonModelOptions: false,
      sidebarSide: "right",
      sidebarProjectSortOrder: "manual",
      sidebarThreadSortOrder: "created_at",
      timestampFormat: "24-hour",
    });
  });

  it("keeps the default setting disabled", () => {
    expect(DEFAULT_CLIENT_SETTINGS.showComingSoonModelOptions).toBe(false);
  });
});
