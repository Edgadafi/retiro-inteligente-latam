import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AGENT_PERSONAS,
  getPersonaAllowedTools,
  getPersonaPrompt,
  isAgentPersona,
  isToolAllowedForPersona,
  personaMeta,
  resolvePersona,
} from "./agent-personas.js";

describe("resolvePersona", () => {
  it("resolves Rita, the only persona", () => {
    assert.deepEqual([...AGENT_PERSONAS], ["rita"]);
    assert.equal(resolvePersona("rita"), "rita");
  });

  it("maps the legacy 'rito' name to Rita", () => {
    assert.equal(resolvePersona("rito"), "rita");
  });

  it("defaults to Rita for unknown or missing values", () => {
    assert.equal(resolvePersona(undefined), "rita");
    assert.equal(resolvePersona("nope"), "rita");
  });

  it("no longer recognises 'rito' as a persona of its own", () => {
    assert.equal(isAgentPersona("rito"), false);
    assert.equal(isAgentPersona("rita"), true);
  });
});

describe("persona contract", () => {
  it("serves the SOUL prompt for every accepted alias", () => {
    const prompt = getPersonaPrompt("rita");
    assert.ok(prompt.startsWith("Eres Rita,"));
    assert.equal(getPersonaPrompt("rito"), prompt);
    assert.equal(getPersonaPrompt(undefined), prompt);
  });

  it("keeps Rita out of money-moving tools (SOUL.md §2, §6.9)", () => {
    const allowed = getPersonaAllowedTools("rita");
    assert.ok(allowed);
    assert.ok(!allowed.includes("transfer"));
    assert.ok(!allowed.includes("purchase_stablebond"));
    assert.equal(isToolAllowedForPersona("rita", "transfer"), false);
    assert.equal(isToolAllowedForPersona("rita", "project_gender_gap"), true);
  });

  it("does not widen tool access through the legacy alias", () => {
    assert.equal(isToolAllowedForPersona("rito", "transfer"), false);
    assert.equal(isToolAllowedForPersona("rito", "purchase_stablebond"), false);
  });

  it("exposes Rita as the display name", () => {
    assert.equal(personaMeta.rita.displayName, "Rita");
  });
});
