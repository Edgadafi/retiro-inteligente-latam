import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyPersonaOutputPolicy, stripAureoLinks } from "./persona-output-policy.js";
import { resolvePersona } from "../config/agent-personas.js";

describe("stripAureoLinks", () => {
  it("leaves messages without Aureo links untouched", () => {
    const text = "Tu brecha estimada es de $1,656,022.97.";
    const { message, redacted } = stripAureoLinks(text);
    assert.equal(message, text);
    assert.equal(redacted, false);
  });

  it("redacts the app subdomain with query params", () => {
    const { message, redacted } = stripAureoLinks(
      "Entra a https://app.aureobitcoin.com/signup?ref=x para comprar.",
    );
    assert.equal(redacted, true);
    assert.ok(!message.includes("aureobitcoin"));
    assert.ok(message.includes("calculadora"));
  });

  it("redacts a bare domain without protocol", () => {
    const { message, redacted } = stripAureoLinks("Ve a www.aureobitcoin.com y crea tu cuenta.");
    assert.equal(redacted, true);
    assert.ok(!message.includes("aureobitcoin"));
  });

  it("keeps the partner name readable when the link was parenthesized", () => {
    const { message } = stripAureoLinks(
      "Tu reserva se construye con Aureo (https://www.aureobitcoin.com), no custodial.",
    );
    assert.ok(!message.includes("aureobitcoin"));
    assert.ok(message.includes("Aureo"));
    assert.ok(message.includes("no custodial"));
    assert.ok(!message.includes("()"));
  });
});

describe("applyPersonaOutputPolicy", () => {
  it("redacts Aureo links for Rita", () => {
    const text = "Ve a https://app.aureobitcoin.com";
    assert.ok(!applyPersonaOutputPolicy("rita", text).includes("aureobitcoin"));
  });

  it("still applies through the legacy 'rito' alias", () => {
    const text = "Ve a https://app.aureobitcoin.com";
    const persona = resolvePersona("rito");
    assert.equal(persona, "rita");
    assert.ok(!applyPersonaOutputPolicy(persona, text).includes("aureobitcoin"));
  });
});
