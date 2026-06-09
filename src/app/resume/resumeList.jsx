import { PlusOutlined } from "@ant-design/icons";
import {
  createResumeItem,
  persistResumeItems,
  setActiveResumeItem,
} from "../storage";

export default function ResumeList({
  activeResume,
  resumeItems,
  setActiveResumeId,
  setMode,
  setResumeItems,
  setStage,
}) {
  function addResumeItem() {
    const nextItem = createResumeItem(resumeItems.length + 1, "", {
      active: true,
    });
    const nextItems = setActiveResumeItem(
      [nextItem, ...resumeItems],
      nextItem.id
    );

    setResumeItems(nextItems);
    setActiveResumeId(nextItem.id);
    setMode("general");
    setStage("original");
    persistResumeItems(nextItems);
  }

  function selectResumeItem(item) {
    const nextItems = setActiveResumeItem(resumeItems, item.id);

    setResumeItems(nextItems);
    setActiveResumeId(item.id);
    persistResumeItems(nextItems);
  }

  return (
    <>
      <button
        className="resume-add-card"
        aria-label="新增简历"
        onClick={addResumeItem}
        type="button"
      >
        <PlusOutlined />
      </button>
      <ul className="resume-version-list">
        {resumeItems.map((item) => (
          <li key={item.id}>
            <button
              className={
                item.id === activeResume?.id
                  ? "resume-version-tile active"
                  : "resume-version-tile"
              }
              onClick={() => selectResumeItem(item)}
              type="button"
            >
              <h2>{item.title}</h2>
              <p>
                版本：<b>{item.version}</b>
              </p>
              <p>
                职位：<b>{item.role || "未填"}</b>
              </p>
              <p>
                更新：<b>{item.updated}</b>
              </p>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
