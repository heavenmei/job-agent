import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  createResumeItem,
  persistResumeItems,
  setActiveResumeItem,
} from "../storage";
import { Button } from "antd";

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

  function downloadResumeItem(event, item) {
    event.stopPropagation();

    const blob = new Blob([item.resume || ""], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${item.title || "resume"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function deleteResumeItem(event, item) {
    event.stopPropagation();

    const remainingItems = resumeItems.filter(
      (resumeItem) => resumeItem.id !== item.id
    );
    const fallbackItem =
      remainingItems[0] ||
      createResumeItem(1, "", {
        active: true,
      });
    const nextItems = setActiveResumeItem(
      remainingItems.length ? remainingItems : [fallbackItem],
      fallbackItem.id
    );

    setResumeItems(nextItems);
    setActiveResumeId(fallbackItem.id);
    setMode("general");
    setStage("original");
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
            <div
              className={
                item.id === activeResume?.id
                  ? "resume-version-tile active"
                  : "resume-version-tile"
              }
              onClick={() => selectResumeItem(item)}
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
              <div className="absolute right-1 top-1 flex gap-2">
                <Button
                  size="small"
                  variant="text"
                  onClick={(event) => downloadResumeItem(event, item)}
                  icon={<DownloadOutlined />}
                />

                <Button
                  size="small"
                  variant="text"
                  onClick={(event) => deleteResumeItem(event, item)}
                  icon={<DeleteOutlined />}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
