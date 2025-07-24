'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Settings as SettingsIcon,
  User,
  Keyboard,
  Palette,
  Save,
  Plus,
  Trash2,
  Image,
  Moon,
  Sun,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/database';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Shortcut {
  id: string;
  key: string;
  productId: number;
  productName: string;
}

const defaultShortcuts: Shortcut[] = [];

export default function SettingsView() {
  const { currentUser, darkMode, toggleDarkMode, products } = useAppStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [isShortcutDialogOpen, setIsShortcutDialogOpen] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ key: '', productId: 0, productName: '' });
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      username: currentUser?.username || '',
    },
  });

  useEffect(() => {
    loadSettings();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await db.products.toArray();
      useAppStore.getState().setProducts(productsData);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await db.settings.get('settings');
      if (settings?.companyLogo) {
        setCompanyLogo(settings.companyLogo);
      }

      // Cargar foto de perfil del usuario actual
      if (currentUser?.id) {
        const user = await db.users.get(currentUser.id);
        if (user?.profilePhoto) {
          setProfilePhoto(user.profilePhoto);
        }
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const updateData: Partial<typeof currentUser> = {
        name: data.name,
        username: data.username,
        updatedAt: new Date(),
      };

      if (data.password) {
        updateData.password = data.password;
      }

      await db.users.update(currentUser.id!, updateData);

      // Actualizar el usuario en el store
      const updatedUser = await db.users.get(currentUser.id!);
      if (updatedUser) {
        useAppStore.getState().login(updatedUser);
      }

      setIsEditingProfile(false);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('El logo no puede ser mayor a 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const logoUrl = e.target?.result as string;
        setCompanyLogo(logoUrl);

        try {
          await db.settings.update('settings', { companyLogo: logoUrl });
        } catch (error) {
          console.error('Error guardando logo:', error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // 3MB
        toast.error('La foto de perfil no puede ser mayor a 3MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const photoUrl = e.target?.result as string;
        setProfilePhoto(photoUrl);

        try {
          if (currentUser?.id) {
            await db.users.update(currentUser.id, { profilePhoto: photoUrl });
            // Actualizar el usuario en el store
            const updatedUser = await db.users.get(currentUser.id);
            if (updatedUser) {
              useAppStore.getState().login(updatedUser);
            }
            toast.success('Foto de perfil actualizada');
          }
        } catch (error) {
          console.error('Error guardando foto de perfil:', error);
          toast.error('Error al guardar la foto de perfil');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addShortcut = () => {
    if (newShortcut.key && newShortcut.productId && newShortcut.productName) {
      const id = Date.now().toString();
      setShortcuts([...shortcuts, { id, ...newShortcut }]);
      setNewShortcut({ key: '', productId: 0, productName: '' });
      setIsShortcutDialogOpen(false);
    }
  };

  const removeShortcut = (id: string) => {
    setShortcuts(shortcuts.filter(s => s.id !== id));
  };

  const saveShortcuts = async () => {
    if (!currentUser) return;

    try {
      const shortcutStrings = shortcuts.map(s => `${s.key}:${s.productId}:${s.productName}`);
      await db.users.update(currentUser.id!, { shortcuts: shortcutStrings });
      toast.success('Atajos guardados exitosamente');
    } catch (error) {
      console.error('Error guardando atajos:', error);
      toast.error('Error al guardar los atajos');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configuración</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perfil de Usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Perfil de Usuario
            </CardTitle>
            <CardDescription>
              Personaliza tu información personal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Foto de perfil */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Foto de Perfil</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border-2 border-dashed border-muted-foreground/25 rounded-full flex items-center justify-center bg-muted/10 overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo 3MB
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
            {!isEditingProfile ? (
              <>
                <div>
                  <span className="text-sm font-medium">Nombre:</span>
                  <p className="text-muted-foreground">{currentUser?.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Usuario:</span>
                  <p className="text-muted-foreground">{currentUser?.username}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Rol:</span>
                  <Badge variant={currentUser?.role === 'admin' ? 'default' : 'secondary'}>
                    {currentUser?.role === 'admin' ? 'Administrador' : 'Vendedor'}
                  </Badge>
                </div>
                <Button onClick={() => setIsEditingProfile(true)}>
                  Editar Perfil
                </Button>
              </>
            ) : (
              <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <Input
                    id="username"
                    {...register('username')}
                    className={errors.username ? 'border-red-500' : ''}
                  />
                  {errors.username && (
                    <p className="text-sm text-red-500">{errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Nueva Contraseña (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    placeholder="Dejar vacío para mantener la actual"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Preferencias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Preferencias
            </CardTitle>
            <CardDescription>
              Configura la apariencia y comportamiento del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span>Modo Oscuro</span>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
            </div>

            {currentUser?.role === 'admin' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span className="text-sm font-medium">Logo de la Empresa</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/10">
                  {companyLogo ? (
                    <img
                      src={companyLogo}
                      alt="Logo empresa"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Image className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo 5MB
                  </p>
                </div>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Atajos Personalizados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Atajos de Teclado
              </CardTitle>
              <CardDescription>
                Configura atajos de teclado para agregar productos rápidamente al carrito
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Dialog open={isShortcutDialogOpen} onOpenChange={setIsShortcutDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Atajo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nuevo Atajo de Producto</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tecla</Label>
                      <Input
                        placeholder="Ej: 1, 2, q, w, F1, etc."
                        value={newShortcut.key}
                        onChange={(e) => setNewShortcut({...newShortcut, key: e.target.value})}
                        maxLength={10}
                      />
                      <p className="text-xs text-muted-foreground">
                        Cualquier tecla o combinación
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Producto</Label>
                      <Select
                        value={newShortcut.productId.toString()}
                        onValueChange={(value) => {
                          const productId = parseInt(value);
                          const product = products.find(p => p.id === productId);
                          setNewShortcut({
                            ...newShortcut,
                            productId,
                            productName: product?.name || ''
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id!.toString()}>
                              {product.name} - S/{product.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {products.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No hay productos disponibles. Agrega productos primero.
                        </p>
                      )}
                    </div>



                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsShortcutDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button
                        onClick={addShortcut}
                        className="flex-1"
                        disabled={!newShortcut.key || !newShortcut.productId}
                      >
                        Agregar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button size="sm" onClick={saveShortcuts}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {shortcuts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Keyboard className="w-12 h-12 mx-auto mb-4" />
              <p>No hay atajos configurados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tecla</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortcuts.map((shortcut) => (
                  <TableRow key={shortcut.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {shortcut.key}
                      </Badge>
                    </TableCell>
                    <TableCell>{shortcut.productName}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeShortcut(shortcut.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
