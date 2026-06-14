</main>
      </div>
    </div>
  )
 
  return (
    <BrowserRouter>
      <AuthContext.Provider value={{ user, setUser }}>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px 0 rgba(236, 72, 153, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#ec4899',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {user ? appShell : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </AuthContext.Provider>
    </BrowserRouter>
  )
}
 
export default App
