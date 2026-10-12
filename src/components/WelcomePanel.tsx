import type { ReactNode } from "react";
import { content } from "../content";
import { fs, HOME, isFile } from "../fs";
import { PixelSprite } from "./PixelSprite";

const Cmd = ({ children }: { children: ReactNode }) => (
  <span className="tp-claude-cmd">{children}</span>
);

// Example names come from the real tree, so the tips stay true if it changes.
const home = fs.tree[HOME].children;
const folder = home.find((name) => !isFile(name));
const file = folder && fs.tree[folder].children.find(isFile);
const hasContact = "contact.txt" in fs.files;

export function WelcomePanel() {
  const { site, welcome } = content;
  return (
    <div className="tp-claude">
      <div className="tp-claude-title">
        {welcome.title} <span className="tp-muted">{welcome.version}</span>
      </div>
      <div className="tp-claude-left">
        <div className="tp-claude-welcome">Welcome to {site.firstName}'s terminal!</div>
        <PixelSprite />
        <div className="tp-claude-meta">
          {welcome.metaLine}
          <br />
          {welcome.cwdLabel}
        </div>
      </div>
      <div className="tp-claude-right">
        <div className="tp-claude-heading">Tips for getting started</div>
        <div className="tp-claude-row">
          <Cmd>ls</Cmd> lists what's here
          {folder && (
            <>
              {" — "}
              <Cmd>ls {folder}</Cmd> peeks into a folder without moving
            </>
          )}
        </div>
        <div className="tp-claude-row">
          {folder && (
            <>
              <Cmd>cd {folder}</Cmd> goes in,{" "}
            </>
          )}
          <Cmd>cd ..</Cmd> goes back up, <Cmd>cd</Cmd> alone returns home to ~
        </div>
        {file && (
          <div className="tp-claude-row">
            <Cmd>cat {file}</Cmd> prints a file — paths work too, like{" "}
            <Cmd>
              cat {folder}/{file}
            </Cmd>
          </div>
        )}
        <div className="tp-claude-sep" />
        <div className="tp-claude-heading">Good to know</div>
        <div className="tp-claude-row">
          Anything ending in .txt is a file you can cat; everything else is a folder you can cd into
        </div>
        <div className="tp-claude-row">
          <Cmd>pwd</Cmd> · <Cmd>tree</Cmd> · <Cmd>clear</Cmd> · <Cmd>toggle</Cmd> for the normal
          website
        </div>
        <div className="tp-claude-note">
          start with <Cmd>ls</Cmd>
          {hasContact && ", and cat contact.txt to reach the human"}
        </div>
      </div>
    </div>
  );
}
