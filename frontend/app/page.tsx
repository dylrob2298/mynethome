'use client'

import { useState } from 'react'
import { Feed } from '@/types/feed'
import { FeedSidebar } from '@/components/feed-sidebar'
import { ArticleList } from '@/components/article-list'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AddFeedDialog } from '@/components/add-feed-dialog'

// Sample data for feeds and articles
const sampleFeeds: Feed[] = [
  { 
    id: '1', 
    name: 'Tech News', 
    url: 'https://technews.com/rss', 
    category: 'Technology', 
    iconUrl: '/placeholder.svg?height=16&width=16',
    description: 'Stay up-to-date with the latest technology news and trends.'
  },
  { 
    id: '2', 
    name: 'World News', 
    url: 'https://worldnews.com/rss', 
    category: 'News', 
    iconUrl: '/placeholder.svg?height=16&width=16',
    description: 'Get the latest updates on global events and international affairs.'
  },
  { 
    id: '3', 
    name: 'Science Daily', 
    url: 'https://sciencedaily.com/rss', 
    category: 'Science', 
    iconUrl: '/placeholder.svg?height=16&width=16',
    description: 'Discover the latest scientific research and breakthroughs.'
  },
  { 
    id: '4', 
    name: 'Gaming News', 
    url: 'https://gamingnews.com/rss', 
    category: 'Technology', 
    iconUrl: '/placeholder.svg?height=16&width=16',
    description: 'Keep up with the latest gaming news, reviews, and releases.'
  },
  { 
    id: '5', 
    name: 'Sports Update', 
    url: 'https://sportsupdate.com/rss', 
    category: 'News', 
    iconUrl: '/placeholder.svg?height=16&width=16',
    description: 'Get the latest sports news, scores, and highlights.'
  },
  { 
    id: '6', 
    name: 'Personal Blog', 
    url: 'https://myblog.com/rss',
    description: 'A personal blog covering various topics and experiences.'
  },
  { 
    id: '7', 
    name: 'Local News', 
    url: 'https://localnews.com/rss',
    description: 'Stay informed about local events and community news.'
  },
]

const sampleArticles = [
  {
    id: '1',
    title: 'The Future of AI in Web Development',
    imageUrl: '/placeholder.svg?height=400&width=800',
    author: 'Jane Doe',
    publishedAt: '2023-06-15T10:00:00Z',
    content: `
      <p>Artificial Intelligence is revolutionizing the way we approach web development. From automated coding assistants to intelligent design systems, AI is making its mark in every aspect of the development process.</p>
      <h2>Key Areas of Impact</h2>
      <ul>
        <li>Code Generation and Optimization</li>
        <li>User Experience Personalization</li>
        <li>Automated Testing and Debugging</li>
        <li>Predictive Analytics for Performance</li>
      </ul>
      <p>As we move forward, it's clear that AI will play an increasingly important role in shaping the future of web development. Developers who embrace these technologies will be well-positioned to create more efficient, user-friendly, and innovative web applications.</p>
    `,
    url: 'https://example.com/ai-web-development',
    feedId: '1',
    feedName: 'Tech News'
  },
  {
    id: '2',
    title: 'Responsive Design Best Practices for 2023',
    imageUrl: '/placeholder.svg?height=400&width=800',
    author: 'John Smith',
    publishedAt: '2023-06-14T14:30:00Z',
    content: `
      <p>As mobile usage continues to dominate, responsive design remains crucial for creating effective web experiences. Here are some best practices for 2023:</p>
      <ol>
        <li>Mobile-first approach</li>
        <li>Fluid typography</li>
        <li>Optimized images and media</li>
        <li>Touch-friendly navigation</li>
        <li>Performance optimization</li>
      </ol>
      <p>By following these practices, developers can ensure their websites provide an optimal viewing experience across a wide range of devices.</p>
    `,
    url: 'https://example.com/responsive-design-2023',
    feedId: '1',
    feedName: 'Tech News'
  },
  {
    id: '3',
    title: 'The Rise of JAMstack Architecture',
    imageUrl: '/placeholder.svg?height=400&width=800',
    author: 'Alice Johnson',
    publishedAt: '2023-06-13T09:15:00Z',
    content: `
      <p>JAMstack (JavaScript, APIs, and Markup) is gaining popularity due to its ability to create fast, secure, and scalable web applications. Key benefits include:</p>
      <ul>
        <li>Improved performance</li>
        <li>Better security</li>
        <li>Scalability and lower costs</li>
        <li>Better developer experience</li>
      </ul>
      <p>As more developers and organizations adopt JAMstack, we're seeing a shift in how modern web applications are built and deployed.</p>
    `,
    url: 'https://example.com/jamstack-architecture',
    feedId: '1',
    feedName: 'Tech News'
  },
  {
    id: '4',
    title: 'Global Climate Change: A Comprehensive Overview',
    imageUrl: '/placeholder.svg?height=400&width=800',
    author: 'Dr. Emily Green',
    publishedAt: '2023-06-12T11:00:00Z',
    content: `
      <p>Climate change continues to be one of the most pressing issues of our time. This article provides a comprehensive overview of the current state of global climate change, its causes, and potential solutions.</p>
      <h2>Key Points</h2>
      <ul>
        <li>Rising global temperatures</li>
        <li>Melting ice caps and rising sea levels</li>
        <li>Extreme weather events</li>
        <li>Impact on biodiversity</li>
        <li>Mitigation and adaptation strategies</li>
      </ul>
      <p>Understanding these aspects is crucial for developing effective policies and taking action to combat climate change on both individual and global scales.</p>
    `,
    url: 'https://example.com/global-climate-change-overview',
    feedId: '2',
    feedName: 'World News'
  },
  {
    id: '5',
    title: 'Breakthrough in Quantum Computing: A New Era of Processing Power',
    imageUrl: '/placeholder.svg?height=400&width=800',
    author: 'Dr. Robert Quantum',
    publishedAt: '2023-06-11T09:30:00Z',
    content: `
      <p>Scientists have achieved a major breakthrough in quantum computing, paving the way for unprecedented processing power. This development could revolutionize fields such as cryptography, drug discovery, and complex system modeling.</p>
      <h2>Implications</h2>
      <ul>
        <li>Solving complex problems in seconds</li>
        <li>Enhanced machine learning capabilities</li>
        <li>New frontiers in scientific research</li>
        <li>Potential challenges to current encryption methods</li>
      </ul>
      <p>As quantum computers become more powerful and accessible, we can expect to see significant advancements across various scientific and technological domains.</p>
    `,
    url: 'https://example.com/quantum-computing-breakthrough',
    feedId: '3',
    feedName: 'Science Daily'
  }
]

export default function Home() {
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [feeds, setFeeds] = useState(sampleFeeds)
  const [isAddFeedDialogOpen, setIsAddFeedDialogOpen] = useState(false)

  const currentFeed = selectedFeed ? feeds.find(feed => feed.id === selectedFeed) : null
  const displayedArticles = selectedFeed
    ? sampleArticles.filter(article => article.feedId === selectedFeed)
    : selectedFolder
    ? sampleArticles.filter(article => {
        const feed = feeds.find(f => f.id === article.feedId)
        return feed && feed.category === selectedFolder
      })
    : sampleArticles

  const feedName = currentFeed 
    ? currentFeed.name 
    : selectedFolder 
    ? selectedFolder 
    : 'All Feeds'

  const feedDescription = currentFeed?.description

  const handleAddFeed = (name: string, url: string, category: string) => {
    const newFeed = {
      id: (feeds.length + 1).toString(),
      name,
      url,
      category,
      description: ''
    }
    setFeeds([...feeds, newFeed])
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <FeedSidebar
          feeds={feeds}
          selectedFeed={selectedFeed}
          selectedFolder={selectedFolder}
          onSelectFeed={setSelectedFeed}
          onSelectFolder={setSelectedFolder}
          onAddFeed={() => setIsAddFeedDialogOpen(true)}
        />
        <SidebarInset className="flex-grow">
          <ArticleList 
            articles={displayedArticles} 
            feedName={feedName} 
            feedDescription={feedDescription}
          />
        </SidebarInset>
      </div>
      <AddFeedDialog
        isOpen={isAddFeedDialogOpen}
        onClose={() => setIsAddFeedDialogOpen(false)}
        onAddFeed={handleAddFeed}
      />
    </SidebarProvider>
  )
}

