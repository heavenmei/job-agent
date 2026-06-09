import { Tag } from "antd";

export function JobTable({ jobs }) {
  return (
    <div className="job-table" role="table" aria-label="岗位列表">
      <div className="job-row head" role="row">
        <span>岗位</span>
        <span>城市</span>
        <span>学历</span>
        <span>来源</span>
        <span>匹配</span>
      </div>
      {jobs.map((job) => (
        <article className="job-row" key={job.id} role="row">
          <span>
            <strong>{job.title}</strong>
            <small>{job.company} · {job.salary}</small>
          </span>
          <span>{job.city}</span>
          <span>{job.degree}</span>
          <span>{job.source}</span>
          <Tag color={job.match >= 90 ? "green" : "blue"}>{job.match}%</Tag>
        </article>
      ))}
    </div>
  );
}
