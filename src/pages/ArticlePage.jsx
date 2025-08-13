import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export default function ArticlePage() {
    const { filename } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchArticle() {
            try {
                const fileRes = await fetch(`https://myscratchblocks.onrender.com/scratch-channel/articles/${filename}`);
                const text = await fileRes.text();
                const lines = text.split("\n");

                if (lines.length < 3) {
                    console.warn(`Skipping ${filename}: not enough lines`);
                    return;
                }

                const metadataRow = lines[2].trim();
                if (!metadataRow.startsWith("|") || !metadataRow.endsWith("|")) {
                    console.warn(`Skipping ${filename}: invalid metadata row`);
                    return;
                }

                const metadataValues = metadataRow
                    .split("|")
                    .map(s => s.trim())
                    .filter(s => s.length > 0);

                if (metadataValues.length < 3) {
                    console.warn(`Skipping ${filename}: not enough metadata`);
                    return;
                }

                const [title, author, date] = metadataValues;
                const contentStartIndex = lines.findIndex((line, i) => i > 2 && line.trim() !== "");
                
                if (contentStartIndex === -1) {
                    console.warn(`Skipping ${filename}: no content`);
                    return;
                }

                const content = await marked.parse(lines.slice(contentStartIndex).join("\n"));

                let thumbnail = null;
                const imgRegex = /<img[^>]+src="([^">]+)"/;
                const imgMatch = content.match(imgRegex);
                if (imgMatch && imgMatch[1]) {
                    thumbnail = imgMatch[1];
                }

                setArticle({
                    title,
                    author,
                    date,
                    content,
                    filename,
                    thumbnail
                });
            } catch (error) {
                console.error("Failed to fetch article:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchArticle();
    }, [filename]);

    if (loading) {
        return <div>Loading article...</div>;
    }

    if (!article) {
        return <div>Article not found</div>;
    }

    return (
        <div className="page article-full">
            <div className="article-header">
                <h1>{article.title}</h1>
                <div className="meta">
                    <span className="author">By: {article.author}</span>
                    <span className="date">Date: {article.date}</span>
                </div>
            </div>
            {article.thumbnail && (
                <div className="article-thumbnail">
                    <img src={article.thumbnail} alt="Article thumbnail" />
                </div>
            )}
            <div
                className="article-full-content"
                dangerouslySetInnerHTML={{ __html: article.content }}
            />
        </div>
    );
}
