import { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  publishDate: string;
  status: 'draft' | 'published' | 'archived';
  views: number;
}

const initialNews: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'TechCorp Indonesia Raih Penghargaan Best Workplace 2025',
    content: 'TechCorp Indonesia berhasil meraih penghargaan Best Workplace 2025 dari Great Place to Work Institute. Penghargaan ini diberikan atas komitmen perusahaan dalam menciptakan lingkungan kerja yang inklusif, inovatif, dan mendukung kesejahteraan karyawan.',
    category: 'News',
    publishDate: '2025-01-15',
    status: 'published',
    views: 1250,
  },
  {
    id: 'news-2',
    title: 'Peluncuran Program Beasiswa Karyawan 2025',
    content: 'Dalam rangka mendukung pengembangan kompetensi, perusahaan meluncurkan program beasiswa untuk karyawan yang ingin melanjutkan pendidikan. Program ini mencakup biaya kuliah penuh dan tunjangan belajar.',
    category: 'News',
    publishDate: '2025-01-10',
    status: 'published',
    views: 890,
  },
  {
    id: 'culture-1',
    title: 'Family Day 2025 - Kebersamaan dan Keceriaan',
    content: 'Acara Family Day tahunan sukses diselenggarakan dengan berbagai kegiatan menarik untuk karyawan dan keluarga. Berbagai permainan, doorprize, dan pertunjukan menghibur peserta sepanjang hari.',
    category: 'Culture',
    publishDate: '2025-01-20',
    status: 'published',
    views: 750,
  },
  {
    id: 'culture-2',
    title: 'Values Champion Program - Menghargai Budaya Perusahaan',
    content: 'Program Values Champion diluncurkan untuk menghargai karyawan yang menjadi teladan dalam menjalankan nilai-nilai perusahaan. Setiap bulan, karyawan terpilih akan mendapatkan penghargaan khusus.',
    category: 'Culture',
    publishDate: '2025-01-25',
    status: 'published',
    views: 620,
  },
  {
    id: 'news-3',
    title: 'Kebijakan Hybrid Working Diperpanjang',
    content: 'Berdasarkan evaluasi positif dari implementasi hybrid working, kebijakan kerja fleksibel akan terus berlaku hingga akhir 2025. Karyawan dapat memilih jadwal kerja yang sesuai dengan kebutuhan.',
    category: 'News',
    publishDate: '2025-01-05',
    status: 'published',
    views: 2100,
  },
  {
    id: 'news-4',
    title: 'Rencana Ekspansi Regional Q2 2025',
    content: 'Sebagai bagian dari strategi pertumbuhan, perusahaan berencana membuka kantor baru di beberapa kota besar di Indonesia pada kuartal kedua tahun ini.',
    category: 'News',
    publishDate: '2025-02-01',
    status: 'draft',
    views: 0,
  },
];

const categories = ['News', 'Culture'];

export default function HRNewsManagement() {
  const [news, setNews] = useState<NewsArticle[]>(initialNews);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [viewingNews, setViewingNews] = useState<NewsArticle | null>(null);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [deleteNews, setDeleteNews] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    publishDate: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });
  const { toast } = useToast();

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openCreateDialog = () => {
    setEditingNews(null);
    setFormData({
      title: '',
      content: '',
      category: '',
      publishDate: new Date().toISOString().split('T')[0],
      status: 'draft',
    });
    setShowDialog(true);
  };

  const openEditDialog = (item: NewsArticle) => {
    setEditingNews(item);
    setFormData({
      title: item.title,
      content: item.content,
      category: item.category,
      publishDate: item.publishDate,
      status: item.status,
    });
    setShowDialog(true);
  };

  const openDetailDialog = (item: NewsArticle) => {
    setViewingNews(item);
    setShowDetailDialog(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.content || !formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (editingNews) {
      setNews(prev => prev.map(item => 
        item.id === editingNews.id 
          ? { ...item, ...formData }
          : item
      ));
      toast({
        title: 'Content Updated',
        description: 'The content has been updated successfully.',
      });
    } else {
      const newArticle: NewsArticle = {
        id: `news-${Date.now()}`,
        ...formData,
        views: 0,
      };
      setNews(prev => [newArticle, ...prev]);
      toast({
        title: 'Content Created',
        description: 'The content has been created successfully.',
      });
    }
    setShowDialog(false);
  };

  const handleDelete = () => {
    if (deleteNews) {
      setNews(prev => prev.filter(item => item.id !== deleteNews.id));
      toast({
        title: 'Content Deleted',
        description: 'The content has been deleted.',
      });
      setDeleteNews(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'News':
        return <Badge className="bg-blue-500">News</Badge>;
      case 'Culture':
        return <Badge className="bg-purple-500">Culture</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">News & Culture Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage company news and culture content</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Content
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="News">News</SelectItem>
                <SelectItem value="Culture">Culture</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content ({filteredNews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Publish Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNews.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium line-clamp-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.content.substring(0, 60)}...</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(item.category)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {item.publishDate}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {item.views.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetailDialog(item)} title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteNews(item)} title="Delete">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredNews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No content found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingNews?.title}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 pt-2">
              {viewingNews && getCategoryBadge(viewingNews.category)}
              {viewingNews && getStatusBadge(viewingNews.status)}
              <span className="text-muted-foreground ml-2">
                Published: {viewingNews?.publishDate}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground whitespace-pre-wrap">{viewingNews?.content}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {viewingNews?.views.toLocaleString()} views
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? 'Edit Content' : 'Create Content'}</DialogTitle>
            <DialogDescription>
              {editingNews ? 'Update the content details.' : 'Create a new news or culture content.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title"
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter content..."
                rows={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Publish Date *</Label>
                <Input
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'draft' | 'published' | 'archived') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingNews ? 'Save Changes' : 'Create Content'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteNews} onOpenChange={() => setDeleteNews(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteNews?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}